# PropuestaCard - Corrección de visibilidad del botón de votación

## Problema
El botón "Vote on this proposal" no era visible en las tarjetas de propuesta, a pesar de que la propuesta estaba en estado activo. Esto se debía a varios problemas en el componente `ProposalCard.tsx`:

1. Uso de `now` como estado que podía ser `null` causando que la validación fallara
2. Dependencia incorrecta en el `useEffect` que causaba re-renderizados innecesarios
3. Lógica de estado de propuesta con orden de verificación incorrecto que priorizaba 'defeated' sobre 'active'

## Solución
Se realizaron los siguientes cambios en `web/src/components/ProposalCard.tsx`:

1. **Renombramiento y corrección del estado temporal**: 
   - Cambiado `now` a `timestamp` y estado inicializado a `0` en lugar de `null`
   - Eliminado el chequeo `now === null` que bloqueaba la renderización

2. **Corrección de la lógica de estado de propuesta**:
   - Reorganizado el orden de verificación para que sea lógico:
     1. `executed`
     2. `pending`
     3. `active`
     4. `defeated`
     5. `succeeded`

3. **Optimización de dependencias**:
   - Estado `timestamp` se actualiza cada segundo pero sin dependencia en `proposal.proposalId`
   - Eliminadas dependencias innecesarias en `useCallback` y `useMemo`

4. **Eliminación del estado de carga específico**: 
   - Ya no se necesita un renderizado especial cuando `timestamp` es nulo
   - El valor inicial de `0` es suficiente y se actualiza inmediatamente en el cliente

## Resultado
El botón "Vote on this proposal" ahora es visible correctamente para todas las propuestas en estado activo. Los usuarios conectados pueden acceder al modal de votación sin problemas. La lógica de estado es más confiable y el componente se renderiza de manera consistente.

## Próximos pasos
- Verificar que el botón de votación se oculte correctamente para propuestas en otros estados (pending, defeated, etc.)
- Asegurar que el estado de votación del usuario se mantenga correctamente después de la interacción
- Implementar pruebas unitarias para cubrir todos los estados de propuesta

Generado con [Continue](https://continue.dev)

Co-Authored-By: Continue <noreply@continue.dev>