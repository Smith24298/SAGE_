import os

import uvicorn


def main() -> None:
    """Run FastAPI with host/port controlled by environment variables.

    This avoids hardcoding localhost for production deployments.
    """

    host = os.getenv("HOST", os.getenv("UVICORN_HOST", "0.0.0.0"))
    port = int(os.getenv("PORT", os.getenv("UVICORN_PORT", "8000")))
    reload = os.getenv("RELOAD", "").lower() in {"1", "true", "yes"}
    log_level = os.getenv("LOG_LEVEL", "info")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
    )


if __name__ == "__main__":
    main()
