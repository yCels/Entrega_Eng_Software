from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session


def salvar(
    db: Session,
    mensagem_conflito: str = "Operação viola uma restrição de integridade do banco",
    status_code: int = 400,
) -> None:
    """Confirma a transação atual de forma segura (RNF: validação transacional).

    - Sucesso: COMMIT — todas as alterações da operação são gravadas juntas.
    - Violação de UNIQUE/CHECK/FK: ROLLBACK e resposta HTTP amigável (em vez de 500).
    - Qualquer outro erro de banco: ROLLBACK e o erro é propagado.
    """
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status_code, detail=mensagem_conflito)
    except SQLAlchemyError:
        db.rollback()
        raise
