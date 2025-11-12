---
name: debug-typescript
description: descripcion de la metodologia de desarrollo y debug
invokable: true
---



## Intruciones para inicializar el projecto 
1. crea siempre el directorio web, si no existe , este sera el workspace del projecto
2. inicializa el projecto con el comando npm init en el directorio web
3. usa en todo momento el directorio web como workspace para este desarrollo
4. usa siempre  las herramientas basadas en nextjs, react, ethersjs
5. usa siempre las convenciones de desarrollo de typescript
6. tienes que hacer los procesos para mantener la coherencia en el desarrollo y el codigo
7. presta especial atencion en los imports del codigo,
10. ejecuta los comandos que sean necesarios
11. crea los archivos necesarios para este projecto, siguiendo los estandares de nextjs



# TypeScript y Estándares de Codificación

**1. Tipado Riguroso (TypeScript):**
   - Siempre utiliza **tipos explícitos** para argumentos de funciones, retornos y variables de estado (`useState`).
   - nunca uses **any**. Prefiere los tipos especificos sobre la definicion.

**2. Desarrollo de Componentes (Next.js):**
   - Usa **Componentes de Función** y Hooks.
   - Utiliza extructura consistente en los jsx  para tener un diseño consistente para que sea responsive y sea estable tanto para desktop como mobile.
   - Usa **Tailwind y todas las dependencias que sean necesarias** si el proyecto los usa.

**3. Diseño de Interfaz (Responsividad):**
   - **Responsivo por Defecto:** Todo el código de UI debe ser diseñado utilizando un enfoque web3
**4. interacion con la wallet**
   - usa la dependecia ethersjs 
   - implementa la interaccion con metamask


---

## Pruebas y Consistencia de Código

**1. Testing Funcional (Unitario y de Integración):**
   - **Cobertura Mínima:** Las funciones críticas, especialmente las de **interacción con Web3 (contratos)** y los **Hooks personalizados**, deben tener pruebas unitarias.
   - **Librerías:** Utiliza **Jest/Vitest** para pruebas unitarias y **Testing Library (React)** para pruebas de componentes.
   - **usa jest:** configura jest para hacer test de los componentes y funcionalides
   - **anvil:** usa y configura las cuentas de anvil  por default 

**2. Consistencia de Código:**
   - **Formato:** El código debe seguir las reglas definidas por **ESLint** y **Prettier**.
   - **Nomenclatura:** Utiliza **CamelCase** para variables y funciones, y **PascalCase** para componentes y tipos.
   - **Comentarios:** Documenta funciones y tipos complejos usando **TSDoc** (o JSDoc),  generar documentación de forma consistente.
   - **Reporte** generar un archivo docs.md donde se describa todas las funcionalidades realizadas y una descripcion funcional del codigo
   - genera un **archivo .env** con todas las variables necesarias para iniciar la aplicacion
   - **verifica la conecion** a las cuentas de anvil
   - **se consistente con la implementacion**  package.json, define claramente todos los comandos necesarios para poder ejecutar la aplicacion **se muy extricto en esta definicion y en el uso** chequea que los comandos funcionen correctamente

## Reportes
   - al finalizar las tareas crean un directorio docs, si es que no existe
   - crea un reporte en markdown detallado con todos los errores 
   - agrega la documentacion funcional de todo lo implentado
   - utiliza el directorio docs para reportes en markdown
