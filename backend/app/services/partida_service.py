from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.partida import Partida
from app.models.time import Time
from app.models.campeonato import Campeonato
from app.schemas.partida import PartidaCreate, PartidaUpdate
from app.core.transacao import salvar


def _verificar_campeonato(db: Session, campeonato_id: int, user_id: int) -> Campeonato:
    """Busca campeonato verificando posse do organizador."""
    campeonato = db.query(Campeonato).filter(
        Campeonato.id == campeonato_id,
        Campeonato.organizador_id == user_id,
    ).first()
    if not campeonato:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    return campeonato


def _verificar_nao_encerrado(campeonato: Campeonato):
    """Campeonato encerrado não aceita mais mudanças na agenda."""
    if campeonato.encerrado:
        raise HTTPException(status_code=400, detail="O campeonato está encerrado")


def _validar_times(db: Session, campeonato_id: int, dados: PartidaCreate):
    """Valida que os dois times existem, pertencem ao campeonato e são diferentes.

    Validação transacional: as linhas dos dois times são travadas com
    SELECT ... FOR UPDATE até o fim da transação. Assim, duas requisições
    simultâneas envolvendo o mesmo time são serializadas e a checagem de
    conflito + INSERT acontecem de forma atômica. A ordenação por id evita deadlock.
    """
    if dados.time_mandante_id == dados.time_visitante_id:
        raise HTTPException(status_code=400, detail="Uma partida deve ser entre dois times diferentes")

    times = (
        db.query(Time)
        .filter(
            Time.id.in_([dados.time_mandante_id, dados.time_visitante_id]),
            Time.campeonato_id == campeonato_id,
        )
        .order_by(Time.id)
        .with_for_update()
        .all()
    )
    ids_encontrados = {t.id for t in times}

    if dados.time_mandante_id not in ids_encontrados:
        raise HTTPException(status_code=404, detail="Time mandante não encontrado neste campeonato")
    if dados.time_visitante_id not in ids_encontrados:
        raise HTTPException(status_code=404, detail="Time visitante não encontrado neste campeonato")


def _validar_conflitos(db: Session, dados: PartidaCreate, ignorar_partida_id: int | None = None):
    """
    US 17: Impede duas partidas no mesmo horário e local.
    US 18: Impede um time de ter duas partidas no mesmo horário.

    Na remarcação, `ignorar_partida_id` tira a própria partida da busca,
    senão ela conflitaria com ela mesma.
    """
    outras = db.query(Partida)
    if ignorar_partida_id is not None:
        outras = outras.filter(Partida.id != ignorar_partida_id)

    # Conflito de local + horário
    conflito_local = outras.filter(
        Partida.data_hora == dados.data_hora,
        Partida.local == dados.local,
    ).first()
    if conflito_local:
        raise HTTPException(status_code=400, detail="Já existe uma partida neste horário e local")

    # Conflito de agenda do time
    conflito_time = outras.filter(
        Partida.data_hora == dados.data_hora,
        or_(
            Partida.time_mandante_id.in_([dados.time_mandante_id, dados.time_visitante_id]),
            Partida.time_visitante_id.in_([dados.time_mandante_id, dados.time_visitante_id]),
        ),
    ).first()
    if conflito_time:
        raise HTTPException(status_code=400, detail="Um dos times já tem partida neste horário")


def agendar(db: Session, campeonato_id: int, dados: PartidaCreate, user_id: int) -> Partida:
    """Agenda uma partida com validação de conflitos."""
    campeonato = _verificar_campeonato(db, campeonato_id, user_id)
    _verificar_nao_encerrado(campeonato)
    _validar_times(db, campeonato_id, dados)
    _validar_conflitos(db, dados)

    nova_partida = Partida(
        data_hora=dados.data_hora,
        local=dados.local,
        campeonato_id=campeonato_id,
        time_mandante_id=dados.time_mandante_id,
        time_visitante_id=dados.time_visitante_id,
    )
    db.add(nova_partida)
    # Rede de segurança: se outra transação gravou o mesmo horário/local,
    # a UNIQUE uq_partidas_data_hora_local dispara e é feito ROLLBACK.
    salvar(db, "Já existe uma partida neste horário e local")
    db.refresh(nova_partida)
    return nova_partida


def listar(db: Session, campeonato_id: int, user_id: int) -> list[Partida]:
    """Lista partidas do campeonato em ordem de data."""
    _verificar_campeonato(db, campeonato_id, user_id)
    return (
        db.query(Partida)
        .filter(Partida.campeonato_id == campeonato_id)
        .order_by(Partida.data_hora, Partida.id)
        .all()
    )


def obter(db: Session, partida_id: int, user_id: int) -> Partida:
    """Busca uma partida pelo ID, verificando posse."""
    partida = db.query(Partida).filter(Partida.id == partida_id).first()
    if not partida:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    _verificar_campeonato(db, partida.campeonato_id, user_id)
    return partida


def editar(db: Session, partida_id: int, dados: PartidaUpdate, user_id: int) -> Partida:
    """Remarca a partida (data, local e/ou times) com as mesmas validações do agendamento."""
    partida = obter(db, partida_id, user_id)
    _verificar_nao_encerrado(partida.campeonato)

    # campos não enviados (ou enviados como null) mantêm o valor atual
    alteracoes = {k: v for k, v in dados.model_dump().items() if v is not None}
    novos = PartidaCreate(
        data_hora=alteracoes.get("data_hora", partida.data_hora),
        local=alteracoes.get("local", partida.local),
        time_mandante_id=alteracoes.get("time_mandante_id", partida.time_mandante_id),
        time_visitante_id=alteracoes.get("time_visitante_id", partida.time_visitante_id),
    )

    trocou_times = (novos.time_mandante_id, novos.time_visitante_id) != (
        partida.time_mandante_id,
        partida.time_visitante_id,
    )
    if trocou_times and partida.eventos:
        # os gols e cartões registrados são de jogadores dos times antigos
        raise HTTPException(
            status_code=400,
            detail="Não é possível trocar os times de uma partida que já tem eventos registrados",
        )

    _validar_times(db, partida.campeonato_id, novos)
    _validar_conflitos(db, novos, ignorar_partida_id=partida.id)

    partida.data_hora = novos.data_hora
    partida.local = novos.local
    partida.time_mandante_id = novos.time_mandante_id
    partida.time_visitante_id = novos.time_visitante_id
    salvar(db, "Já existe uma partida neste horário e local")
    db.refresh(partida)
    return partida


def excluir(db: Session, partida_id: int, user_id: int):
    """Exclui a partida e, em cascata, os eventos dela."""
    partida = obter(db, partida_id, user_id)
    _verificar_nao_encerrado(partida.campeonato)
    db.delete(partida)
    salvar(db)
