FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
COPY index.html vite.config.js ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DATA_DIR=/app/data-store

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./
COPY data ./data
COPY --from=frontend-builder /app/dist ./dist

RUN mkdir -p /app/data-store

EXPOSE 10000
CMD ["sh", "-lc", "gunicorn --bind 0.0.0.0:${PORT:-10000} app:app"]
