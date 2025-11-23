# Reporte de Refactorización: Migración a API Routes para Transacciones

## Introducción

Este reporte documenta la refactorización realizada para mover toda la lógica de interacción con la blockchain desde el frontend hacia API routes en Next.js. El objetivo fue centralizar la lógica de negocio, mejorar la seguridad y eliminar dependencias redundantes de `ethers` y `wagmi`.

## Cambios Realizados

### 1. Creación de API Routes para Transacciones

Se crearon nuevos endpoints bajo `./web/src/app/api/transactions/`:

- `create-proposal/route.ts`: Para crear nuevas propuestas
- `vote/route.ts`: Para votar en propuestas
- `execute-proposal/route.ts`: Para ejecutar propuestas aprobadas
- `status/route.ts`: Para verificar el estado del servicio

Estos endpoints utilizan `viem` en el backend para interactuar con la blockchain, eliminando la necesidad de instancias del lado del cliente.

### 2. Actualización de la Lógica Frontend

Se modificaron los componentes clave para usar los nuevos endpoints:

**app/page.tsx**:
- Eliminación de `useWeb3` y `useMetaTransactions`
- Implementación de fetch directo a los endpoints API
- Actualización del flujo de votación para usar `/api/transactions/vote`

**components/CreateProposal.tsx**:
- Eliminación de dependencias de `wagmi` y `viem`
- Implementación de `createProposalViaAPI` que hace fetch a `/api/transactions/create-proposal`
- Simplificación del componente al eliminar lógica de conexión con blockchain

### 3. Eliminación de Archivos Obsoletos

Se eliminaron todos los archivos que duplicaban funcionalidades o ya no eran necesarios:

```bash
rm ./web/src/hooks/useMetaTransactions.ts
rm ./web/src/utils/metaTransactions.ts
rm ./web/src/hooks/useWeb3.ts
rm ./web/src/viem.ts
rm ./web/src/wagmi.ts
rm ./web/src/utils/ethersAdapter.ts
```

Esto dejó el proyecto más limpio y con una arquitectura más sencilla.

### 4. Mantenimiento de Funcionalidad

- El endpoint `daemon` existente se mantuvo para lectura de datos
- El endpoint `relay` existente se mantuvo para relaying de transacciones
- Se aseguró que los contratos y ABIs sigan siendo accesibles

## Beneficios de la Refactorización

1. **Seguridad Mejorada**: Las claves privadas del relayer permanecen en el servidor
2. **Simplificación del Frontend**: El cliente no necesita gestionar conexiones con wallets
3. **Consistencia**: Toda la lógica de negocio está centralizada en el backend
4. **Mantenibilidad**: Menos dependencias y código duplicado
5. **Escalabilidad**: Fácil de extender con más funcionalidades en el backend

## Consideraciones Finales

La arquitectura resultante sigue el patrón de backend-for-frontend (BFF) donde el servidor Next.js actúa como intermediario entre el frontend y la blockchain. Esto es especialmente útil para aplicaciones DAO donde se desea ocultar la complejidad de la interacción con Ethereum del usuario final.

**Próximos Pasos Recomendados**:
- Implementar autenticación para endpoints sensibles
- Añadir validación de esquema con Zod
- Implementar rate limiting
- Agregar logging y monitoring
- Migrar a un servicio backend separado para producción

**Disclaimer**: Para entornos de producción, se recomienda separar el backend en un servicio independiente y no exponer endpoints de escritura sin autenticación.