FROM otel/opentelemetry-collector-contrib:0.115.0
COPY otel-collector-cloud.yaml /etc/otel/config.yaml
CMD ["--config=/etc/otel/config.yaml"]
EXPOSE 4317 4318
