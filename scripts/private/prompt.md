Por favor, asocia los países proporcionados con sus respectivas monedas (oficiales y alternativas) basándote en información económica actual. Sigue estas especificaciones:

**Requisitos:**
1. **Asociación completa:** Para cada país, crea objetos para:
   - Moneda oficial principal
   - Monedas alternativas (si existen y son de curso legal o uso común en el país)
2. **Validación:** Si un país no tiene moneda oficial claramente reconocida, omítelo completamente
3. **Formato estricto:** Cada asociación debe ser un objeto en el formato exacto:
   ```javascript
   { country_id: X, currency_id: Y, example: 'FORMATO_DE_EJEMPLO' },
   ```
   Donde `FORMATO_DE_EJEMPLO` debe ser la representación formateada del valor numérico **1.234.567,89** en dicha moneda, utilizando los separadores de miles y decimales apropiados y colocando el símbolo o código según la convención local. Para monedas sin símbolo específico, usar el código ISO 4217.
4. **Fuentes de datos:** Utiliza únicamente los arreglos proporcionados, asociando por nombres coincidentes

**Datos de entrada:**
```json
[[PONER_PAISES_AQUI]]
```

```json
[[PONER_MONEDAS_AQUI]]
```

**Instrucciones de procesamiento:**
- Analiza cada país individualmente
- Identifica todas sus monedas válidas (oficiales y alternativas)
- Para cada moneda válida, crea un objeto separado
- **Formato de ejemplo:** En el campo `example`, muestra cómo se escribiría la cantidad **1.234.567,89** en esa moneda, respetando:
  - Posición del símbolo/código (antes o después)
  - Separador de miles (punto, coma, espacio o ninguno)
  - Separador decimal (coma o punto)
  - Formato culturalmente apropiado
- Mantén el orden de los países proporcionados
- Solo incluye países con moneda oficial identificable

**Salida requerida:**
- Solo el listado de objetos en el formato especificado
- Sin texto adicional, explicaciones o comentarios
- Un objeto por línea, terminados con coma
- Listo para copiar y pegar en un arreglo JavaScript

Proporciona únicamente los objetos resultantes.

**Ejemplos de formato esperado en `example`:**
- Dólar estadounidense: `$1,234,567.89`
- Euro: `€1.234.567,89` o `1.234.567,89 €`
- Yen japonés: `¥1,234,568` o `1.234.568 ¥`
- Libra esterlina: `£1,234,567.89`
- Peso argentino: `$ 1.234.567,89`
- Rupia india: `₹12,34,567.89`
- Franco suizo: `CHF 1'234'567.89`

Nota: El valor 1.234.567,89 debe formatearse exactamente con dos decimales excepto para monedas que no los usen (como el yen que redondea a unidades).
