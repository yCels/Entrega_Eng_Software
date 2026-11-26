from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.transacao import salvar
from app.models.partida import Partida
from app.models.time import Time
from app.schemas.calendario import CalendarioCreate
from app.services import partida_service
from app.services.calendario_builder import CalendarioBuilder


def gerar(db: Session, campeonato_id: int, dados: CalendarioCreate, user_id: int) -> list[Partida]:
    """Gera e grava o calendário todos contra todos do campeonato (US 24).

    Tudo ou nada: se qualquer partida gerada conflitar com outra já agendada
    (mesmo horário e local, ou time já jogando no horário), nenhuma é gravada.
    """
    campeonato = partida_service._verificar_campeonato(db, campeonato_id, user_id)

    if campeonato.encerrado:
        raise HTTPException(status_code=400, detail="O campeonato está encerrado")

    ja_tem_partidas = db.query(Partida).filter(Partida.campeonato_id == campeonato_id).first()
    if ja_tem_partidas:
        raise HTTPException(
            status_code=400,
            detail="O campeonato já tem partidas agendadas. Exclua-as antes de gerar o calendário.",
        )

    data_inicio = dados.data_inicio or campeonato.data_inicio
    if data_inicio < campeonato.data_inicio:
        raise HTTPException(
            status_code=400,
            detail=f"A primeira rodada não pode ser antes do início do campeonato ({campeonato.data_inicio:%d/%m/%Y})",
        )

    times = db.query(Time).filter(Time.campeonato_id == campeonato_id).order_by(Time.id).all()

    try:
        partidas = (
            CalendarioBuilder()
            .set_times([t.id for t in times])
            .set_local(dados.local)
            .set_data_inicio(data_inicio)
            .set_horario(dados.horario)
            .set_intervalo_dias(dados.intervalo_dias)
            .set_duracao_jogo(dados.duracao_jogo_minutos)
            .set_ida_e_volta(dados.ida_e_volta)
            .build()
        )
    except ValueError as erro:
        raise HTTPException(status_code=400, detail=str(erro))

    # o builder garante que as partidas geradas não conflitam entre si;
    # aqui confere contra o que já está no banco (inclusive outros campeonatos)
    for dados_partida in partidas:
        partida_service._validar_conflitos(db, dados_partida)

    novas = [
        Partida(campeonato_id=campeonato_id, **dados_partida.model_dump())
        for dados_partida in partidas
    ]
    db.add_all(novas)
    # rede de segurança: se outra requisição gravou no mesmo horário/local
    # nesse meio tempo, a UNIQUE dispara e é feito ROLLBACK de todas
    salvar(db, "Já existe uma partida neste horário e local")
    for partida in novas:
        db.refresh(partida)
    return novas
