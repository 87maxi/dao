# Reporte de Error: Variable no definida

## Problema
Se encontró un error en `src/components/ProposalCard.tsx` en la línea 174:

```tsx
Created {formatDate(createdDate)}
```

El error ocurría porque la variable `createdDate` estaba siendo utilizada pero no estaba definida en el componente. Aunque la función `formatDate` estaba correctamente implementada, la variable `createdDate` faltaba en la declaración de variables del componente.

## Solución Implementada

Se agregó la declaración faltante de `createdDate` usando `useMemo`:

```tsx
// Memoized dates
const createdDate = useMemo(() => new Date(Number(proposal.createdAt) * 1000), [proposal.createdAt]);
```

Este cambio:

1. Define `createdDate` como una variable memoizada
2. Convierte el timestamp de `createdAt` a un objeto Date
3. Asegura que solo se recalcule cuando cambie `proposal.createdAt`
4. Mantiene consistencia con el manejo de fechas en el resto del componente

## Validación

El fix fue validado confirmando que:

1. El componente se renderiza sin errores
2. La fecha de creación se muestra correctamente
3. El formato de fecha es consistente con el resto de la aplicación
4. No hay errores de consola relacionados con variables no definidas

## Conclusión

El error era simplemente una variable no definida que se estaba utilizando en el JSX. La solución fue agregar la declaración faltante usando `useMemo` para mantener rendimiento optimo y consistencia con las mejores prácticas de React. Ahora el componente funciona correctamente mostrando la fecha de creación de la propuesta.

Generated with [Continue](https://continue.dev)

Co-Authored-By: Continue <noreply@continue.dev>