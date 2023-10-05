FROM oven/bun
WORKDIR /app
COPY . .
RUN bun install

ARG PORT
EXPOSE ${PORT:-3001}

CMD ["bun", "index.ts"]