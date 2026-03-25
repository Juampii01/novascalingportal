# Guía de instalación — NOVA Scaling Dashboard
**Documento interno para onboarding de nuevos clientes**

---

## Requisitos previos del cliente

Antes de empezar, el cliente necesita tener:

- [ ] ManyChat **Pro** activo
- [ ] Instagram Business conectado a ManyChat
- [ ] Acceso a su email para verificar la cuenta del dashboard

---

## PASO 1 — Crear la cuenta del cliente en el dashboard

1. Ir a `localhost:3000/signup` (o el dominio en producción)
2. El cliente se registra con su email y contraseña
3. Verificar el email si Supabase lo requiere
4. Anotar el **UUID del cliente** — es el ID que aparece en Supabase > Authentication > Users

> El UUID tiene este formato: `1501c912-4980-4724-90cd-3ae334f4aed3`
> Lo necesitás en todos los pasos siguientes.

---

## PASO 2 — Crear el perfil del cliente en Supabase

En Supabase > SQL Editor, correr este query reemplazando los valores:

```sql
INSERT INTO nova_client_profile (
  client_id,
  business_name,
  expert_name,
  niche,
  offer_description,
  instagram_url,
  start_date,
  revenue_share_pct
) VALUES (
  'UUID-DEL-CLIENTE',         -- reemplazar con el UUID del paso 1
  'Nombre del negocio',
  'Nombre del experto',
  'Nicho / industria',
  'Descripción de la oferta',
  'https://instagram.com/usuario',
  CURRENT_DATE,
  30                          -- % de revenue share de NOVA
);
```

También crear el registro en `profiles` para que el dashboard lo reconozca:

```sql
INSERT INTO profiles (id, role)
VALUES ('UUID-DEL-CLIENTE', 'client')
ON CONFLICT (id) DO UPDATE SET role = 'client';
```

---

## PASO 3 — Configurar ManyChat

### 3.1 — Crear los tags

En ManyChat > Contacts > Tags, crear estos 4 tags exactamente con estos nombres:

| Tag | Cuándo se aplica |
|-----|-----------------|
| `apertura` | Cuando el contacto entra al bot por primera vez |
| `calificado` | Cuando el lead pasa el filtro de calificación |
| `agendado` | Cuando agenda una llamada |
| `cerrado` | Cuando se convierte en cliente |

### 3.2 — Configurar los flujos con External Requests

En **cada flujo** donde se aplique un tag, agregar un bloque **External Request** con la siguiente configuración:

**URL:**
```
https://nygcxwaxfvxximehybzv.supabase.co/functions/v1/manychat-tag-event
```

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (todo en una sola línea):**
```json
{"client_id":"UUID-DEL-CLIENTE","subscriber_id":"{{subscriber id}}","subscriber_name":"{{first name}} {{last name}}","tag":"NOMBRE-DEL-TAG"}
```

Reemplazando:
- `UUID-DEL-CLIENTE` → el UUID del paso 1 (fijo, no es variable)
- `{{subscriber id}}` → variable de ManyChat (selector de variables)
- `{{first name}} {{last name}}` → variables de ManyChat
- `NOMBRE-DEL-TAG` → el tag correspondiente al flujo (`calificado`, `agendado`, o `cerrado`)

---

## PASO 4 — Configurar el flujo de Calificación

Este flujo corre cuando el lead responde las preguntas de calificación y es apto.

Al final del flujo, agregar el External Request con:
```json
{"client_id":"UUID-DEL-CLIENTE","subscriber_id":"{{subscriber id}}","subscriber_name":"{{first name}} {{last name}}","tag":"calificado"}
```

**Qué hace automáticamente:**
- Registra al lead en el pipeline de ventas del dashboard con stage "calificación"
- Suma 1 a "Leads Calificados" en Adquisición > ManyChat

---

## PASO 5 — Configurar el flujo de Agendamiento

Este flujo corre cuando el lead agenda una llamada (después de recibir el link de calendario).

Agregar External Request con:
```json
{"client_id":"UUID-DEL-CLIENTE","subscriber_id":"{{subscriber id}}","subscriber_name":"{{first name}} {{last name}}","tag":"agendado"}
```

**Qué hace automáticamente:**
- Mueve el lead al stage "llamada" en el pipeline de ventas
- Suma 1 a "Agendados" en Adquisición > ManyChat

---

## PASO 6 — Configurar el flujo de Cierre

Este flujo corre cuando el lead confirma que quiere entrar al programa.

Agregar External Request con:
```json
{"client_id":"UUID-DEL-CLIENTE","subscriber_id":"{{subscriber id}}","subscriber_name":"{{first name}} {{last name}}","tag":"cerrado"}
```

**Qué hace automáticamente:**
- Marca el lead como cerrado en el pipeline de ventas
- Guarda snapshot de todos sus tags (calificado → agendado → cerrado)
- Esos tags aparecen en Trazabilidad con los badges de colores
- Suma 1 a "Cerrados" en Adquisición > ManyChat

---

## PASO 7 — Verificar que funciona

1. Hacer una prueba desde ManyChat con un contacto real o propio
2. Aplicar el tag `calificado` manualmente o disparar el flujo
3. Ir al dashboard > **Ventas** — debe aparecer el lead automáticamente
4. Ir a **Adquisición > ManyChat** — debe verse el contador en 1
5. Aplicar el tag `cerrado`
6. Ir a **Trazabilidad** — debe aparecer el cierre con los badges

Si no aparece nada, revisar:
- Que el UUID en el body sea correcto (sin espacios extra)
- Que el body esté todo en una sola línea sin saltos de línea
- Que ManyChat devuelva `200 OK` en el response del External Request

---

## PASO 8 — Agregar el monto manualmente

El webhook registra el lead automáticamente pero **no sabe el monto**. Después de cada cierre real:

1. Ir a **Ventas** en el dashboard
2. Hacer click en **Editar** en el lead cerrado
3. Ingresar el monto en el campo correspondiente
4. Guardar — el revenue aparece en Trazabilidad y Proyecciones

---

## PASO 9 — Cargar el primer reporte mensual

Para que Proyecciones muestre datos históricos reales:

1. Ir a **Overview** en el dashboard
2. Click en **"+ Reporte mensual"**
3. Completar los campos del mes anterior:
   - Cash collected, revenue share
   - Llamadas agendadas, atendidas, cierres
   - Seguidores nuevos, conversaciones ManyChat
4. Guardar — proyecciones usa estos datos automáticamente

---

## PASO 10 — Configurar el perfil completo del cliente

1. Ir a **Perfil del cliente** en el sidebar
2. Completar:
   - Nombre del negocio y del experto
   - Nicho y descripción de la oferta
   - URL de Instagram
   - Ángulos ganadores (los que más cierres generan)
   - Dolores principales del avatar
3. Guardar

---

## Resumen de lo que queda automático vs manual

| Acción | Automático | Manual |
|--------|-----------|--------|
| Registrar lead calificado | ✅ ManyChat webhook | |
| Mover a "agendado" | ✅ ManyChat webhook | |
| Marcar como cerrado | ✅ ManyChat webhook | |
| Ingresar monto del cierre | | ✅ En Ventas > Editar |
| Cargar reporte mensual | | ✅ En Overview |
| Cargar piezas de contenido | | ✅ En Adquisición > Contenido |
| Sincronizar ManyChat | ✅ Diario automático | ✅ Botón manual |

---

## Referencia técnica

| Dato | Valor |
|------|-------|
| Edge function URL | `https://nygcxwaxfvxximehybzv.supabase.co/functions/v1/manychat-tag-event` |
| Tags requeridos | `calificado`, `agendado`, `cerrado` |
| Variable subscriber ID | `{{subscriber id}}` |
| Método | `POST` |
| Content-Type | `application/json` |

---

*Documento generado para uso interno de NOVA Scaling — v1.0*
