"""Builder Pattern para gerar o calendário de partidas de um campeonato (US 24).

O builder separa a construção do calendário (um objeto complexo, cheio de
parâmetros opcionais) da sua representação final (a lista de partidas).
Cada passo é configurado por um método que devolve o próprio builder,
o que permite encadear as chamadas (interface fluente):

    partidas = (
        CalendarioBuilder()
        .set_times([1, 2, 3, 4])
        .set_local("Quadra Central")
        .set_data_inicio(date(2026, 3, 1))
        .set_horario(time(15, 0))
        .set_intervalo_dias(7)
        .set_ida_e_volta(True)
        .build()
    )

O builder não acessa o banco: só monta as partidas. Quem grava e valida
conflito com o que já existe é o calendario_service.
"""

from datetime import date, datetime, time, timedelta

from app.schemas.partida import PartidaCreate


class CalendarioBuilder:
    def __init__(self):
        # obrigatórios
        self._times: list[int] = []
        self._local: str | None = None
        self._data_inicio: date | None = None
        # opcionais, com valor padrão
        self._horario: time = time(15, 0)
        self._intervalo_dias: int = 7
        self._duracao_jogo_minutos: int = 120
        self._ida_e_volta: bool = False

    # ---------- passos de configuração ----------

    def set_times(self, time_ids: list[int]) -> "CalendarioBuilder":
        self._times = list(time_ids)
        return self

    def set_local(self, local: str) -> "CalendarioBuilder":
        self._local = local
        return self

    def set_data_inicio(self, data_inicio: date) -> "CalendarioBuilder":
        self._data_inicio = data_inicio
        return self

    def set_horario(self, horario: time) -> "CalendarioBuilder":
        """Horário do primeiro jogo de cada rodada."""
        self._horario = horario
        return self

    def set_intervalo_dias(self, dias: int) -> "CalendarioBuilder":
        """Dias entre uma rodada e a próxima."""
        self._intervalo_dias = dias
        return self

    def set_duracao_jogo(self, minutos: int) -> "CalendarioBuilder":
        """Tempo entre os jogos da mesma rodada.

        Todos os jogos são no mesmo local, e o banco não aceita duas partidas
        no mesmo horário e local, então os jogos da rodada são escalonados.
        """
        self._duracao_jogo_minutos = minutos
        return self

    def set_ida_e_volta(self, ida_e_volta: bool) -> "CalendarioBuilder":
        """Se True, gera o returno com os mandos invertidos."""
        self._ida_e_volta = ida_e_volta
        return self

    # ---------- construção ----------

    def build(self) -> list[PartidaCreate]:
        self._validar()

        rodadas = self._gerar_rodadas()
        if self._ida_e_volta:
            returno = [[(v, m) for m, v in rodada] for rodada in rodadas]
            rodadas = rodadas + returno

        partidas = []
        for numero, rodada in enumerate(rodadas):
            dia = self._data_inicio + timedelta(days=numero * self._intervalo_dias)
            primeiro_jogo = datetime.combine(dia, self._horario)
            for ordem, (mandante, visitante) in enumerate(rodada):
                partidas.append(
                    PartidaCreate(
                        data_hora=primeiro_jogo
                        + timedelta(minutes=ordem * self._duracao_jogo_minutos),
                        local=self._local,
                        time_mandante_id=mandante,
                        time_visitante_id=visitante,
                    )
                )
        return partidas

    def _validar(self):
        if len(self._times) < 2:
            raise ValueError("São necessários pelo menos 2 times para gerar o calendário")
        if len(set(self._times)) != len(self._times):
            raise ValueError("A lista de times tem times repetidos")
        if not self._local or not self._local.strip():
            raise ValueError("Informe o local das partidas")
        if self._data_inicio is None:
            raise ValueError("Informe a data de início")
        if self._intervalo_dias < 1:
            raise ValueError("O intervalo entre rodadas deve ser de pelo menos 1 dia")
        if self._duracao_jogo_minutos < 1:
            raise ValueError("A duração do jogo deve ser de pelo menos 1 minuto")

    def _gerar_rodadas(self) -> list[list[tuple[int, int]]]:
        """Todos contra todos pelo método do círculo.

        O primeiro time fica parado e os outros giram uma posição a cada
        rodada. Em cada rodada o time da posição i enfrenta o da posição
        n-1-i, então ninguém joga duas vezes na mesma rodada. Com número
        ímpar de times entra uma "folga" (None): quem pega a folga não joga.
        """
        times = list(self._times)
        if len(times) % 2 == 1:
            times.append(None)

        n = len(times)
        rodadas = []
        for numero in range(n - 1):
            rodada = []
            for i in range(n // 2):
                a, b = times[i], times[n - 1 - i]
                if a is None or b is None:
                    continue
                # alterna o mando para o time fixo não jogar sempre em casa
                if i == 0 and numero % 2 == 1:
                    a, b = b, a
                rodada.append((a, b))
            rodadas.append(rodada)
            # gira todos menos o primeiro
            times = [times[0], times[-1]] + times[1:-1]
        return rodadas
