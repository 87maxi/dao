---
name: projecto-ts-dao
description: utilizar esta descripcion para realizar el projecto
invokable: true
---



# Desarrollar una aplicación web con Next.js 16 que integre:

#### 1. Conexión con MetaMask

**Funcionalidad:**
- Botón para conectar wallet
- Mostrar dirección conectada
- Mostrar balance del usuario en el DAO

#### 2. Panel de Financiación

**Funcionalidad:**
- Input para cantidad de ETH a depositar
- Botón para enviar fondos al DAO
- Mostrar balance actual del usuario en el DAO
- Mostrar balance total del DAO

#### 3. Creación de Propuestas

**Funcionalidad:**
- Formulario con campos:
  - Dirección del beneficiario
  - Cantidad de ETH
  - Fecha límite de votación
- Validación: solo si usuario tiene ≥10% del balance del DAO
- Feedback visual del estado de la transacción

#### 4. Listado de Propuestas

**Funcionalidad:**
- Card por cada propuesta mostrando:
  - ID de la propuesta
  - Beneficiario y monto
  - Fecha límite
  - Votos actuales (A FAVOR / EN CONTRA / ABSTENCIÓN)
  - Estado (Activa, Aprobada, Rechazada, Ejecutada)
- Botones de votación (si está activa)
- Indicador visual del voto actual del usuario

#### 5. Sistema de Votación Gasless

**Funcionalidad:**
- Generar firma off-chain al votar
- Enviar firma al relayer (API route)
- Mostrar feedback sin requerir confirmación de MetaMask para gas
- Actualizar UI en tiempo real

#### 6. Servicio Relayer (API Route)

**Endpoint:** `/api/relay`

**Funcionalidad:**
- Recibir meta-transacción firmada
- Validar formato y firma
- Enviar transacción al MinimalForwarder
- Pagar gas con cuenta del relayer
- Devolver hash de transacción





## implementacion de interfaz responsive
  - usa nextjs y todas las dependencias que sean necesarias para la implemetacion de la interfaz
  - crea una interfaz con foco en la usabilidad de una aplicacion dapp
  - se muy riguroso con la definicion de los estilos de Tailwind y sus configuraciones y dependencias
  - crea interaciones claras para el usuario


## Funcionalidades del Header
   - Título y descripción de la dao - Solo informativo
   - Branding - Identificación de la aplicación
   - Responsive - Se mantiene en todas las vistas
   - Indicador visual de seguridad blockchain


##  Funcionalidades Estado No Autenticado:

   - **Selección de wallet** - Dropdown con direcciones disponibles
   - **Autenticación** - Conexión a blockchain
   - **Habilitación de funciones** - Al conectar, desbloquea otras secciones





##  Funcionalidades Estado Búsqueda:

- Resultados filtrados - Solo documentos que coinciden
- Indicador de match - Columna adicional mostrando relevancia
- Términos resaltados - Texto coincidente en negrita
- Paginación: Si hay más de 10 resultados


## Funcionalidades Footer Cargando:
-  **Indicador de progreso** - Para transacciones pendientes
-  **Contador de confirmaciones** - Número de confirmaciones de bloque
-  **Estado de operación** - Qué acción se está procesando




## Resultados Detallados:

###   Verificación Exitosa:
- Hash coincide con blockchain
- Firmante verificado
- Fecha de firma válida
- Enlace a la transacción




### Tareas de Implementación


1. **Implementar conexión Web3:**
   - Hook personalizado para MetaMask
   - Context provider para estado de wallet
   - Manejo de eventos de cambio de cuenta/red

2. **Implementar componentes UI:**
   - `ConnectWallet.tsx`
   - `FundingPanel.tsx`
   - `CreateProposal.tsx`
   - `ProposalList.tsx`
   - `ProposalCard.tsx`
   - `VoteButtons.tsx`

3. **Implementar lógica de firma:**
   - Función para generar mensaje EIP-712
   - Función para firmar con MetaMask
   - Función para enviar al relayer

4. **Configuración:**
   - Archivo `.env.local` con:
     ```
     NEXT_PUBLIC_DAO_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
     NEXT_PUBLIC_FORWARDER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
     NEXT_PUBLIC_CHAIN_ID=31337
     RELAYER_PRIVATE_KEY=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
     RELAYER_ADDRESS=0x90F79bf6EB2c4f870365E785982E1f101E93b906
     RPC_URL=http://127.0.0.1:8545
     ```

---

---


### Documentación Requerida

1. **README.md** con:
   - Instrucciones de instalación
   - Comandos para deployment
   - Guía de uso de la aplicación
   - Arquitectura del proyecto

2. **Diagramas:**
   - Flujo de meta-transacciones
   - Arquitectura de contratos
   - Flujo de usuario en frontend
---
