# --- Stage 1: Build Frontend (SolidStart) ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/ui
COPY nebula-ui/package*.json ./
RUN npm install
COPY nebula-ui/ .
RUN npm run build

# --- Stage 2: Build Backend (Go Fiber) ---
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app/kernel
COPY nebula-kernel/ .
RUN go build -o nebula-os-kernel ./cmd/main.go

# --- Stage 3: Final Runner ---
FROM node:20-slim
WORKDIR /app

# Install ca-certificates for HTTPS requests from the Go binary
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy built artifacts from previous stages
COPY --from=frontend-builder /app/ui/.output ./ui/.output
COPY --from=backend-builder /app/kernel/nebula-os-kernel .

# Expose Fiber port (Go kernel)
EXPOSE 3000

# Start the SolidStart SSR server on port 3001 in the background,
# then start the Go kernel on port 3000 in the foreground.
ENV PORT=3001
CMD ["sh", "-c", "node ./ui/.output/server/index.mjs & ./nebula-os-kernel"]
