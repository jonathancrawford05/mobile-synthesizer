# ---------- base ----------
FROM python:3.9-slim AS base

# System dependencies required by librosa / soundfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Poetry configuration
ENV POETRY_VERSION=1.7.1 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

RUN pip install --no-cache-dir poetry==${POETRY_VERSION}

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY synthesizer_app/pyproject.toml synthesizer_app/poetry.lock ./
# pyproject.toml references readme = "../README.md"
COPY README.md /README.md

# ---------- production ----------
FROM base AS production

RUN poetry install --only main --no-root

COPY synthesizer_app/ .
RUN poetry install --only main

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ---------- development ----------
FROM base AS development

RUN poetry install --no-root

COPY synthesizer_app/ .
RUN poetry install

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
