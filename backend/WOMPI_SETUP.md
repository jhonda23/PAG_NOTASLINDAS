# Configuración de Wompi - NOTAS LINDAS

## Paso 1: Crear cuenta en Wompi

1. Ve a https://comercios.wompi.co/
2. Crea una cuenta o inicia sesión
3. Completa el proceso de registro con los datos de tu negocio

## Paso 2: Obtener las claves API

### En modo de pruebas (Sandbox):
1. En el panel de Wompi, ve a **Configuración** → **Credenciales**
2. Encontrarás dos claves en la sección de **Pruebas**:
   - **Llave pública de prueba** (comienza con `pub_test_`)
   - **Llave privada de prueba** (comienza con `prv_test_`)

### En modo de producción:
1. Después de verificar tu cuenta, encontrarás las claves en:
   - **Llave pública de producción** (comienza con `pub_prod_`)
   - **Llave privada de producción** (comienza con `prv_prod_`)

## Paso 3: Configurar las claves en tu proyecto

1. Abre el archivo `.env` en la carpeta `backend/`
2. Reemplaza las claves de ejemplo con tus claves reales:

```env
# Claves de Wompi
WOMPI_PUBLIC_KEY=pub_test_tu_clave_publica_aqui
WOMPI_PRIVATE_KEY=prv_test_tu_clave_privada_aqui
```

## Paso 4: Probar el sistema

### Tarjetas de prueba de Wompi:
Para probar pagos en modo sandbox, usa estas tarjetas de prueba:

**Tarjeta aprobada:**
- Número: `4242 4242 4242 4242`
- CVV: cualquier 3 dígitos
- Fecha: cualquier fecha futura

**Tarjeta declinada:**
- Número: `4111 1111 1111 1111`
- CVV: cualquier 3 dígitos
- Fecha: cualquier fecha futura

## Paso 5: Reiniciar el servidor

Después de configurar las claves, reinicia el servidor backend:

```bash
cd backend
npm start
```

## Flujo de pago

1. El usuario agrega productos al carrito
2. Hace clic en **"Finalizar pedido y pagar"**
3. Completa sus datos (nombre, email, teléfono)
4. Es redirigido a la página de pago de Wompi
5. Completa el pago con su tarjeta
6. Es redirigido de vuelta a tu sitio con el resultado

## Métodos de pago soportados por Wompi

- Tarjetas de crédito (Visa, Mastercard, American Express)
- Tarjetas débito
- PSE (Pagos Seguros en Línea)
- Nequi
- Bancolombia
- Corresponsales bancarios

## Configurar Webhook (Opcional pero recomendado)

Para recibir notificaciones automáticas de pagos:

1. En tu panel de Wompi, ve a **Configuración** → **Webhooks**
2. Agrega esta URL: `https://tu-dominio.com/api/payments/wompi-webhook`
3. Selecciona el evento: `transaction.updated`
4. Guarda los cambios

**Nota:** Cuando subas tu sitio a producción, necesitarás usar tu dominio real.

## Soporte

Si tienes problemas:
- Documentación de Wompi: https://docs.wompi.co/
- Soporte de Wompi: soporte@wompi.co

## Cambiar de pruebas a producción

Cuando estés listo para producción:

1. Verifica tu cuenta en el panel de Wompi
2. Reemplaza las claves de prueba con las de producción en `.env`
3. Actualiza las URLs en `js/app.js` de localhost a tu dominio real
4. Reinicia el servidor

---

¡Listo! Tu sistema de pagos está configurado y funcionando.
