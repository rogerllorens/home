# Jobs dashboard

`/app/jobs/[id]` muestra progreso real, ETA conservadora, resumen de propuestas, filas, descargas y logs. La ETA se calcula por velocidad observada si hay filas procesadas; si el job está en cola usa un fallback conservador y copy honesto.
