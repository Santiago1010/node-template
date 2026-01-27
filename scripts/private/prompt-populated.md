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
[
  {
    "id": 1,
    "name": "Afganistán"
  },
  {
    "id": 2,
    "name": "Åland"
  },
  {
    "id": 3,
    "name": "Albania"
  },
  {
    "id": 4,
    "name": "Argelia"
  },
  {
    "id": 5,
    "name": "Samoa Americana"
  },
  {
    "id": 6,
    "name": "Andorra"
  },
  {
    "id": 7,
    "name": "Angola"
  },
  {
    "id": 8,
    "name": "Anguila"
  },
  {
    "id": 9,
    "name": "Antártida"
  },
  {
    "id": 10,
    "name": "Antigua y Barbuda"
  },
  {
    "id": 11,
    "name": "Argentina"
  },
  {
    "id": 12,
    "name": "Armenia"
  },
  {
    "id": 13,
    "name": "Aruba"
  },
  {
    "id": 14,
    "name": "Australia"
  },
  {
    "id": 15,
    "name": "Austria"
  },
  {
    "id": 16,
    "name": "Azerbaiyán"
  },
  {
    "id": 17,
    "name": "Bahamas"
  },
  {
    "id": 18,
    "name": "Baréin"
  },
  {
    "id": 19,
    "name": "Bangladés"
  },
  {
    "id": 20,
    "name": "Barbados"
  },
  {
    "id": 21,
    "name": "Bielorrusia"
  },
  {
    "id": 22,
    "name": "Bélgica"
  },
  {
    "id": 23,
    "name": "Belice"
  },
  {
    "id": 24,
    "name": "Benín"
  },
  {
    "id": 25,
    "name": "Bermudas"
  },
  {
    "id": 26,
    "name": "Bután"
  },
  {
    "id": 27,
    "name": "Bolivia"
  },
  {
    "id": 28,
    "name": "Bonaire, San Eustaquio y Saba"
  },
  {
    "id": 29,
    "name": "Bosnia y Herzegovina"
  },
  {
    "id": 30,
    "name": "Botsuana"
  },
  {
    "id": 31,
    "name": "Isla Bouvet"
  },
  {
    "id": 32,
    "name": "Brasil"
  },
  {
    "id": 33,
    "name": "Territorio Británico del Océano Índico"
  },
  {
    "id": 34,
    "name": "Islas Vírgenes Británicas"
  },
  {
    "id": 35,
    "name": "Brunéi"
  },
  {
    "id": 36,
    "name": "Bulgaria"
  },
  {
    "id": 37,
    "name": "Burkina Faso"
  },
  {
    "id": 38,
    "name": "Burundi"
  },
  {
    "id": 39,
    "name": "Cabo Verde"
  },
  {
    "id": 40,
    "name": "Camboya"
  },
  {
    "id": 41,
    "name": "Camerún"
  },
  {
    "id": 42,
    "name": "Canadá"
  },
  {
    "id": 43,
    "name": "Islas Caimán"
  },
  {
    "id": 44,
    "name": "República Centroafricana"
  },
  {
    "id": 45,
    "name": "Chad"
  },
  {
    "id": 46,
    "name": "Chile"
  },
  {
    "id": 47,
    "name": "China"
  },
  {
    "id": 48,
    "name": "Isla de Navidad"
  },
  {
    "id": 49,
    "name": "Islas Cocos (Keeling)"
  },
  {
    "id": 50,
    "name": "Colombia"
  },
  {
    "id": 51,
    "name": "Comoras"
  },
  {
    "id": 52,
    "name": "República del Congo"
  },
  {
    "id": 53,
    "name": "Islas Cook"
  },
  {
    "id": 54,
    "name": "Costa Rica"
  },
  {
    "id": 55,
    "name": "Croacia"
  },
  {
    "id": 56,
    "name": "Cuba"
  },
  {
    "id": 57,
    "name": "Curazao"
  },
  {
    "id": 58,
    "name": "Chipre"
  },
  {
    "id": 59,
    "name": "Chequia"
  },
  {
    "id": 60,
    "name": "Dinamarca"
  },
  {
    "id": 61,
    "name": "Yibuti"
  },
  {
    "id": 62,
    "name": "Dominica"
  },
  {
    "id": 63,
    "name": "República Dominicana"
  },
  {
    "id": 64,
    "name": "República Democrática del Congo"
  },
  {
    "id": 65,
    "name": "Ecuador"
  },
  {
    "id": 66,
    "name": "Egipto"
  },
  {
    "id": 67,
    "name": "El Salvador"
  },
  {
    "id": 68,
    "name": "Guinea Ecuatorial"
  },
  {
    "id": 69,
    "name": "Eritrea"
  },
  {
    "id": 70,
    "name": "Estonia"
  },
  {
    "id": 71,
    "name": "Esuatini"
  },
  {
    "id": 72,
    "name": "Etiopía"
  },
  {
    "id": 73,
    "name": "Islas Malvinas"
  },
  {
    "id": 74,
    "name": "Islas Feroe"
  },
  {
    "id": 75,
    "name": "Fiyi"
  },
  {
    "id": 76,
    "name": "Finlandia"
  },
  {
    "id": 77,
    "name": "Francia"
  },
  {
    "id": 78,
    "name": "Guayana Francesa"
  },
  {
    "id": 79,
    "name": "Polinesia Francesa"
  },
  {
    "id": 80,
    "name": "Tierras Australes y Antárticas Francesas"
  },
  {
    "id": 81,
    "name": "Gabón"
  },
  {
    "id": 82,
    "name": "Georgia"
  },
  {
    "id": 83,
    "name": "Alemania"
  },
  {
    "id": 84,
    "name": "Ghana"
  },
  {
    "id": 85,
    "name": "Gibraltar"
  },
  {
    "id": 86,
    "name": "Grecia"
  },
  {
    "id": 87,
    "name": "Groenlandia"
  },
  {
    "id": 88,
    "name": "Granada"
  },
  {
    "id": 89,
    "name": "Guadalupe"
  },
  {
    "id": 90,
    "name": "Guam"
  },
  {
    "id": 91,
    "name": "Guatemala"
  },
  {
    "id": 92,
    "name": "Guernsey"
  },
  {
    "id": 93,
    "name": "Guinea"
  },
  {
    "id": 94,
    "name": "Guinea-Bisáu"
  },
  {
    "id": 95,
    "name": "Guyana"
  },
  {
    "id": 96,
    "name": "Haití"
  },
  {
    "id": 97,
    "name": "Islas Heard y McDonald"
  },
  {
    "id": 98,
    "name": "Honduras"
  },
  {
    "id": 99,
    "name": "Hong Kong"
  },
  {
    "id": 100,
    "name": "Hungría"
  },
  {
    "id": 101,
    "name": "Islandia"
  },
  {
    "id": 102,
    "name": "India"
  },
  {
    "id": 103,
    "name": "Indonesia"
  },
  {
    "id": 104,
    "name": "Irán"
  },
  {
    "id": 105,
    "name": "Irak"
  },
  {
    "id": 106,
    "name": "Irlanda"
  },
  {
    "id": 107,
    "name": "Isla de Man"
  },
  {
    "id": 108,
    "name": "Israel"
  },
  {
    "id": 109,
    "name": "Italia"
  },
  {
    "id": 110,
    "name": "Costa de Marfil"
  },
  {
    "id": 111,
    "name": "Jamaica"
  },
  {
    "id": 112,
    "name": "Japón"
  },
  {
    "id": 113,
    "name": "Jersey"
  },
  {
    "id": 114,
    "name": "Jordania"
  },
  {
    "id": 115,
    "name": "Kazajistán"
  },
  {
    "id": 116,
    "name": "Kenia"
  },
  {
    "id": 117,
    "name": "Kiribati"
  },
  {
    "id": 118,
    "name": "Kosovo"
  },
  {
    "id": 119,
    "name": "Kuwait"
  },
  {
    "id": 120,
    "name": "Kirguistán"
  },
  {
    "id": 121,
    "name": "Laos"
  },
  {
    "id": 122,
    "name": "Letonia"
  },
  {
    "id": 123,
    "name": "Líbano"
  },
  {
    "id": 124,
    "name": "Lesoto"
  },
  {
    "id": 125,
    "name": "Liberia"
  },
  {
    "id": 126,
    "name": "Libia"
  },
  {
    "id": 127,
    "name": "Liechtenstein"
  },
  {
    "id": 128,
    "name": "Lituania"
  },
  {
    "id": 129,
    "name": "Luxemburgo"
  },
  {
    "id": 130,
    "name": "Macao"
  },
  {
    "id": 131,
    "name": "Madagascar"
  },
  {
    "id": 132,
    "name": "Malaui"
  },
  {
    "id": 133,
    "name": "Malasia"
  },
  {
    "id": 134,
    "name": "Maldivas"
  },
  {
    "id": 135,
    "name": "Malí"
  },
  {
    "id": 136,
    "name": "Malta"
  },
  {
    "id": 137,
    "name": "Islas Marshall"
  },
  {
    "id": 138,
    "name": "Martinica"
  },
  {
    "id": 139,
    "name": "Mauritania"
  },
  {
    "id": 140,
    "name": "Mauricio"
  },
  {
    "id": 141,
    "name": "Mayotte"
  },
  {
    "id": 142,
    "name": "México"
  },
  {
    "id": 143,
    "name": "Micronesia"
  },
  {
    "id": 144,
    "name": "Moldavia"
  },
  {
    "id": 145,
    "name": "Mónaco"
  },
  {
    "id": 146,
    "name": "Mongolia"
  },
  {
    "id": 147,
    "name": "Montenegro"
  },
  {
    "id": 148,
    "name": "Montserrat"
  },
  {
    "id": 149,
    "name": "Marruecos"
  },
  {
    "id": 150,
    "name": "Mozambique"
  },
  {
    "id": 151,
    "name": "Birmania"
  },
  {
    "id": 152,
    "name": "Namibia"
  },
  {
    "id": 153,
    "name": "Nauru"
  },
  {
    "id": 154,
    "name": "Nepal"
  },
  {
    "id": 155,
    "name": "Nueva Caledonia"
  },
  {
    "id": 156,
    "name": "Nueva Zelanda"
  },
  {
    "id": 157,
    "name": "Nicaragua"
  },
  {
    "id": 158,
    "name": "Níger"
  },
  {
    "id": 159,
    "name": "Nigeria"
  },
  {
    "id": 160,
    "name": "Niue"
  },
  {
    "id": 161,
    "name": "Isla Norfolk"
  },
  {
    "id": 162,
    "name": "Corea del Norte"
  },
  {
    "id": 163,
    "name": "Macedonia del Norte"
  },
  {
    "id": 164,
    "name": "Islas Marianas del Norte"
  },
  {
    "id": 165,
    "name": "Noruega"
  },
  {
    "id": 166,
    "name": "Omán"
  },
  {
    "id": 167,
    "name": "Pakistán"
  },
  {
    "id": 168,
    "name": "Palaos"
  },
  {
    "id": 169,
    "name": "Palestina"
  },
  {
    "id": 170,
    "name": "Panamá"
  },
  {
    "id": 171,
    "name": "Papúa Nueva Guinea"
  },
  {
    "id": 172,
    "name": "Paraguay"
  },
  {
    "id": 173,
    "name": "Perú"
  },
  {
    "id": 174,
    "name": "Filipinas"
  },
  {
    "id": 175,
    "name": "Islas Pitcairn"
  },
  {
    "id": 176,
    "name": "Polonia"
  },
  {
    "id": 177,
    "name": "Portugal"
  },
  {
    "id": 178,
    "name": "Puerto Rico"
  },
  {
    "id": 179,
    "name": "Catar"
  },
  {
    "id": 180,
    "name": "Reunión"
  },
  {
    "id": 181,
    "name": "Rumania"
  },
  {
    "id": 182,
    "name": "Rusia"
  },
  {
    "id": 183,
    "name": "Ruanda"
  },
  {
    "id": 184,
    "name": "San Bartolomé"
  },
  {
    "id": 185,
    "name": "Santa Elena"
  },
  {
    "id": 186,
    "name": "Santa Lucía"
  },
  {
    "id": 187,
    "name": "San Martín"
  },
  {
    "id": 188,
    "name": "San Pedro y Miquelón"
  },
  {
    "id": 189,
    "name": "Samoa"
  },
  {
    "id": 190,
    "name": "San Marino"
  },
  {
    "id": 191,
    "name": "Santo Tomé y Príncipe"
  },
  {
    "id": 192,
    "name": "Arabia Saudita"
  },
  {
    "id": 193,
    "name": "Senegal"
  },
  {
    "id": 194,
    "name": "Serbia"
  },
  {
    "id": 195,
    "name": "Seychelles"
  },
  {
    "id": 196,
    "name": "Sierra Leona"
  },
  {
    "id": 197,
    "name": "Singapur"
  },
  {
    "id": 198,
    "name": "Sint Maarten"
  },
  {
    "id": 199,
    "name": "Eslovaquia"
  },
  {
    "id": 200,
    "name": "Eslovenia"
  },
  {
    "id": 201,
    "name": "Islas Salomón"
  },
  {
    "id": 202,
    "name": "Somalia"
  },
  {
    "id": 203,
    "name": "Sudáfrica"
  },
  {
    "id": 204,
    "name": "Islas Georgias del Sur y Sandwich del Sur"
  },
  {
    "id": 205,
    "name": "Corea del Sur"
  },
  {
    "id": 206,
    "name": "Sudán del Sur"
  },
  {
    "id": 207,
    "name": "España"
  },
  {
    "id": 208,
    "name": "Sri Lanka"
  },
  {
    "id": 209,
    "name": "San Cristóbal y Nieves"
  },
  {
    "id": 210,
    "name": "San Vicente y las Granadinas"
  },
  {
    "id": 211,
    "name": "Sudán"
  },
  {
    "id": 212,
    "name": "Surinam"
  },
  {
    "id": 213,
    "name": "Svalbard y Jan Mayen"
  },
  {
    "id": 214,
    "name": "Suecia"
  },
  {
    "id": 215,
    "name": "Suiza"
  },
  {
    "id": 216,
    "name": "Siria"
  },
  {
    "id": 217,
    "name": "Taiwán"
  },
  {
    "id": 218,
    "name": "Tayikistán"
  },
  {
    "id": 219,
    "name": "Tanzania"
  },
  {
    "id": 220,
    "name": "Tailandia"
  },
  {
    "id": 221,
    "name": "Gambia"
  },
  {
    "id": 222,
    "name": "Países Bajos"
  },
  {
    "id": 223,
    "name": "Timor-Leste"
  },
  {
    "id": 224,
    "name": "Togo"
  },
  {
    "id": 225,
    "name": "Tokelau"
  },
  {
    "id": 226,
    "name": "Tonga"
  },
  {
    "id": 227,
    "name": "Trinidad y Tobago"
  },
  {
    "id": 228,
    "name": "Túnez"
  },
  {
    "id": 229,
    "name": "Turquía"
  },
  {
    "id": 230,
    "name": "Turkmenistán"
  },
  {
    "id": 231,
    "name": "Islas Turcas y Caicos"
  },
  {
    "id": 232,
    "name": "Tuvalu"
  },
  {
    "id": 233,
    "name": "Islas Ultramarinas Menores de Estados Unidos"
  },
  {
    "id": 234,
    "name": "Islas Vírgenes de los Estados Unidos"
  },
  {
    "id": 235,
    "name": "Uganda"
  },
  {
    "id": 236,
    "name": "Ucrania"
  },
  {
    "id": 237,
    "name": "Emiratos Árabes Unidos"
  },
  {
    "id": 238,
    "name": "Reino Unido"
  },
  {
    "id": 239,
    "name": "Estados Unidos"
  },
  {
    "id": 240,
    "name": "Uruguay"
  },
  {
    "id": 241,
    "name": "Uzbekistán"
  },
  {
    "id": 242,
    "name": "Vanuatu"
  },
  {
    "id": 243,
    "name": "Ciudad del Vaticano"
  },
  {
    "id": 244,
    "name": "Venezuela"
  },
  {
    "id": 245,
    "name": "Vietnam"
  },
  {
    "id": 246,
    "name": "Wallis y Futuna"
  },
  {
    "id": 247,
    "name": "Sahara Occidental"
  },
  {
    "id": 248,
    "name": "Yemen"
  },
  {
    "id": 249,
    "name": "Zambia"
  },
  {
    "id": 250,
    "name": "Zimbabue"
  }
]
```

```json
[
  {
    "id": 1,
    "name": "Afgani afgano",
    "symbol": "؋"
  },
  {
    "id": 2,
    "name": "Dírham de los Emiratos Árabes Unidos",
    "symbol": "د.إ"
  },
  {
    "id": 3,
    "name": "Lek albanés",
    "symbol": "L"
  },
  {
    "id": 4,
    "name": "Dram armenio",
    "symbol": "֏"
  },
  {
    "id": 5,
    "name": "Florín de las Antillas Neerlandesas",
    "symbol": "ƒ"
  },
  {
    "id": 6,
    "name": "Kwanza angoleño",
    "symbol": "Kz"
  },
  {
    "id": 7,
    "name": "Peso argentino",
    "symbol": "$"
  },
  {
    "id": 8,
    "name": "Dólar australiano",
    "symbol": "A$"
  },
  {
    "id": 9,
    "name": "Florín arubeño",
    "symbol": "ƒ"
  },
  {
    "id": 10,
    "name": "Manat azerbaiyano",
    "symbol": "₼"
  },
  {
    "id": 11,
    "name": "Marco convertible de Bosnia y Herzegovina",
    "symbol": "KM"
  },
  {
    "id": 12,
    "name": "Dólar barbadense",
    "symbol": "Bds$"
  },
  {
    "id": 13,
    "name": "Taka de Bangladés",
    "symbol": "৳"
  },
  {
    "id": 14,
    "name": "Lev búlgaro",
    "symbol": "лв"
  },
  {
    "id": 15,
    "name": "Dinar bahreiní",
    "symbol": ".د.ب"
  },
  {
    "id": 16,
    "name": "Franco burundiano",
    "symbol": "FBu"
  },
  {
    "id": 17,
    "name": "Dólar bermudeño",
    "symbol": "BD$"
  },
  {
    "id": 18,
    "name": "Dólar de Brunéi",
    "symbol": "B$"
  },
  {
    "id": 19,
    "name": "Boliviano boliviano",
    "symbol": "Bs."
  },
  {
    "id": 20,
    "name": "Real brasileño",
    "symbol": "R$"
  },
  {
    "id": 21,
    "name": "Dólar bahameño",
    "symbol": "B$"
  },
  {
    "id": 22,
    "name": "Ngultrum de Bután",
    "symbol": "Nu."
  },
  {
    "id": 23,
    "name": "Pula de Botsuana",
    "symbol": "P"
  },
  {
    "id": 24,
    "name": "Rublo bielorruso",
    "symbol": "Br"
  },
  {
    "id": 25,
    "name": "Dólar beliceño",
    "symbol": "BZ$"
  },
  {
    "id": 26,
    "name": "Dólar canadiense",
    "symbol": "C$"
  },
  {
    "id": 27,
    "name": "Franco congoleño",
    "symbol": "FC"
  },
  {
    "id": 28,
    "name": "Franco suizo",
    "symbol": "CHF"
  },
  {
    "id": 29,
    "name": "Peso chileno",
    "symbol": "$"
  },
  {
    "id": 30,
    "name": "Yuan chino",
    "symbol": "¥"
  },
  {
    "id": 31,
    "name": "Peso colombiano",
    "symbol": "$"
  },
  {
    "id": 32,
    "name": "Colón costarricense",
    "symbol": "₡"
  },
  {
    "id": 33,
    "name": "Peso cubano convertible",
    "symbol": "CUC$"
  },
  {
    "id": 34,
    "name": "Peso cubano",
    "symbol": "₱"
  },
  {
    "id": 35,
    "name": "Escudo caboverdiano",
    "symbol": "Esc"
  },
  {
    "id": 36,
    "name": "Corona checa",
    "symbol": "Kč"
  },
  {
    "id": 37,
    "name": "Franco yibutiano",
    "symbol": "Fdj"
  },
  {
    "id": 38,
    "name": "Corona danesa",
    "symbol": "kr"
  },
  {
    "id": 39,
    "name": "Peso dominicano",
    "symbol": "RD$"
  },
  {
    "id": 40,
    "name": "Dinar argelino",
    "symbol": "دج"
  },
  {
    "id": 41,
    "name": "Libra egipcia",
    "symbol": "E£"
  },
  {
    "id": 42,
    "name": "Nakfa eritreo",
    "symbol": "Nfk"
  },
  {
    "id": 43,
    "name": "Birr etíope",
    "symbol": "Br"
  },
  {
    "id": 44,
    "name": "Euro",
    "symbol": "€"
  },
  {
    "id": 45,
    "name": "Dólar fiyiano",
    "symbol": "FJ$"
  },
  {
    "id": 46,
    "name": "Libra malvinense",
    "symbol": "FK£"
  },
  {
    "id": 47,
    "name": "Libra esterlina",
    "symbol": "£"
  },
  {
    "id": 48,
    "name": "Lari georgiano",
    "symbol": "₾"
  },
  {
    "id": 49,
    "name": "Libra de Guernsey",
    "symbol": "£"
  },
  {
    "id": 50,
    "name": "Cedi ghanés",
    "symbol": "₵"
  },
  {
    "id": 51,
    "name": "Libra de Gibraltar",
    "symbol": "£"
  },
  {
    "id": 52,
    "name": "Dalasi gambiano",
    "symbol": "D"
  },
  {
    "id": 53,
    "name": "Franco guineano",
    "symbol": "FG"
  },
  {
    "id": 54,
    "name": "Quetzal guatemalteco",
    "symbol": "Q"
  },
  {
    "id": 55,
    "name": "Dólar guyanés",
    "symbol": "GY$"
  },
  {
    "id": 56,
    "name": "Dólar de Hong Kong",
    "symbol": "HK$"
  },
  {
    "id": 57,
    "name": "Lempira hondureño",
    "symbol": "L"
  },
  {
    "id": 58,
    "name": "Kuna croata",
    "symbol": "kn"
  },
  {
    "id": 59,
    "name": "Gourde haitiano",
    "symbol": "G"
  },
  {
    "id": 60,
    "name": "Forinto húngaro",
    "symbol": "Ft"
  },
  {
    "id": 61,
    "name": "Rupia indonesia",
    "symbol": "Rp"
  },
  {
    "id": 62,
    "name": "Nuevo shequel israelí",
    "symbol": "₪"
  },
  {
    "id": 63,
    "name": "Rupia india",
    "symbol": "₹"
  },
  {
    "id": 64,
    "name": "Dinar iraquí",
    "symbol": "ع.د"
  },
  {
    "id": 65,
    "name": "Rial iraní",
    "symbol": "﷼"
  },
  {
    "id": 66,
    "name": "Corona islandesa",
    "symbol": "kr"
  },
  {
    "id": 67,
    "name": "Dólar jamaiquino",
    "symbol": "J$"
  },
  {
    "id": 68,
    "name": "Dinar jordano",
    "symbol": "د.ا"
  },
  {
    "id": 69,
    "name": "Yen japonés",
    "symbol": "¥"
  },
  {
    "id": 70,
    "name": "Chelín keniano",
    "symbol": "KSh"
  },
  {
    "id": 71,
    "name": "Som kirguís",
    "symbol": "с"
  },
  {
    "id": 72,
    "name": "Riel camboyano",
    "symbol": "៛"
  },
  {
    "id": 73,
    "name": "Franco comorano",
    "symbol": "CF"
  },
  {
    "id": 74,
    "name": "Won norcoreano",
    "symbol": "₩"
  },
  {
    "id": 75,
    "name": "Won surcoreano",
    "symbol": "₩"
  },
  {
    "id": 76,
    "name": "Dinar kuwaití",
    "symbol": "د.ك"
  },
  {
    "id": 77,
    "name": "Dólar de las Islas Caimán",
    "symbol": "CI$"
  },
  {
    "id": 78,
    "name": "Tenge kazajo",
    "symbol": "₸"
  },
  {
    "id": 79,
    "name": "Kip laosiano",
    "symbol": "₭"
  },
  {
    "id": 80,
    "name": "Libra libanesa",
    "symbol": "ل.ل"
  },
  {
    "id": 81,
    "name": "Rupia de Sri Lanka",
    "symbol": "Rs"
  },
  {
    "id": 82,
    "name": "Dólar liberiano",
    "symbol": "L$"
  },
  {
    "id": 83,
    "name": "Loti de Lesoto",
    "symbol": "L"
  },
  {
    "id": 84,
    "name": "Dinar libio",
    "symbol": "ل.د"
  },
  {
    "id": 85,
    "name": "Dírham marroquí",
    "symbol": "د.م."
  },
  {
    "id": 86,
    "name": "Leu moldavo",
    "symbol": "L"
  },
  {
    "id": 87,
    "name": "Ariary malgache",
    "symbol": "Ar"
  },
  {
    "id": 88,
    "name": "Denar macedonio",
    "symbol": "ден"
  },
  {
    "id": 89,
    "name": "Kyat de Myanmar",
    "symbol": "Ks"
  },
  {
    "id": 90,
    "name": "Tugrik mongol",
    "symbol": "₮"
  },
  {
    "id": 91,
    "name": "Pataca macanesa",
    "symbol": "MOP$"
  },
  {
    "id": 92,
    "name": "Uquiya mauritana",
    "symbol": "UM"
  },
  {
    "id": 93,
    "name": "Rupia mauriciana",
    "symbol": "Rs"
  },
  {
    "id": 94,
    "name": "Rufiyaa de Maldivas",
    "symbol": "Rf"
  },
  {
    "id": 95,
    "name": "Kwacha malauí",
    "symbol": "MK"
  },
  {
    "id": 96,
    "name": "Peso mexicano",
    "symbol": "$"
  },
  {
    "id": 97,
    "name": "Ringgit malayo",
    "symbol": "RM"
  },
  {
    "id": 98,
    "name": "Metical mozambiqueño",
    "symbol": "MT"
  },
  {
    "id": 99,
    "name": "Dólar namibio",
    "symbol": "N$"
  },
  {
    "id": 100,
    "name": "Naira nigeriana",
    "symbol": "₦"
  },
  {
    "id": 101,
    "name": "Córdoba nicaragüense",
    "symbol": "C$"
  },
  {
    "id": 102,
    "name": "Corona noruega",
    "symbol": "kr"
  },
  {
    "id": 103,
    "name": "Rupia nepalesa",
    "symbol": "Rs"
  },
  {
    "id": 104,
    "name": "Dólar neozelandés",
    "symbol": "NZ$"
  },
  {
    "id": 105,
    "name": "Rial omaní",
    "symbol": "ر.ع."
  },
  {
    "id": 106,
    "name": "Balboa panameño",
    "symbol": "B/."
  },
  {
    "id": 107,
    "name": "Sol peruano",
    "symbol": "S/"
  },
  {
    "id": 108,
    "name": "Kina de Papúa Nueva Guinea",
    "symbol": "K"
  },
  {
    "id": 109,
    "name": "Peso filipino",
    "symbol": "₱"
  },
  {
    "id": 110,
    "name": "Rupia pakistaní",
    "symbol": "Rs"
  },
  {
    "id": 111,
    "name": "Zloty polaco",
    "symbol": "zł"
  },
  {
    "id": 112,
    "name": "Guaraní paraguayo",
    "symbol": "₲"
  },
  {
    "id": 113,
    "name": "Riyal qatarí",
    "symbol": "ر.ق."
  },
  {
    "id": 114,
    "name": "Leu rumano",
    "symbol": "lei"
  },
  {
    "id": 115,
    "name": "Dinar serbio",
    "symbol": "дин"
  },
  {
    "id": 116,
    "name": "Rublo ruso",
    "symbol": "₽"
  },
  {
    "id": 117,
    "name": "Franco ruandés",
    "symbol": "FRw"
  },
  {
    "id": 118,
    "name": "Riyal saudí",
    "symbol": "ر.س"
  },
  {
    "id": 119,
    "name": "Dólar salomonense",
    "symbol": "SI$"
  },
  {
    "id": 120,
    "name": "Rupia seychelense",
    "symbol": "SR"
  },
  {
    "id": 121,
    "name": "Libra sudanesa",
    "symbol": "ج.س."
  },
  {
    "id": 122,
    "name": "Corona sueca",
    "symbol": "kr"
  },
  {
    "id": 123,
    "name": "Dólar de Singapur",
    "symbol": "S$"
  },
  {
    "id": 124,
    "name": "Libra de Santa Elena",
    "symbol": "£"
  },
  {
    "id": 125,
    "name": "Leone de Sierra Leona",
    "symbol": "Le"
  },
  {
    "id": 126,
    "name": "Chelín somalí",
    "symbol": "Sh"
  },
  {
    "id": 127,
    "name": "Dólar surinamés",
    "symbol": "$"
  },
  {
    "id": 128,
    "name": "Libra sursudanesa",
    "symbol": "£"
  },
  {
    "id": 129,
    "name": "Dobra de Santo Tomé y Príncipe",
    "symbol": "Db"
  },
  {
    "id": 130,
    "name": "Lilangeni suazi",
    "symbol": "E"
  },
  {
    "id": 131,
    "name": "Libra siria",
    "symbol": "£"
  },
  {
    "id": 132,
    "name": "Baht tailandés",
    "symbol": "฿"
  },
  {
    "id": 133,
    "name": "Somoni tayiko",
    "symbol": "SM"
  },
  {
    "id": 134,
    "name": "Manat turcomano",
    "symbol": "m"
  },
  {
    "id": 135,
    "name": "Dinar tunecino",
    "symbol": "د.ت"
  },
  {
    "id": 136,
    "name": "Paʻanga tongano",
    "symbol": "T$"
  },
  {
    "id": 137,
    "name": "Lira turca",
    "symbol": "₺"
  },
  {
    "id": 138,
    "name": "Dólar de Trinidad y Tobago",
    "symbol": "TT$"
  },
  {
    "id": 139,
    "name": "Nuevo dólar taiwanés",
    "symbol": "NT$"
  },
  {
    "id": 140,
    "name": "Chelín tanzano",
    "symbol": "TSh"
  },
  {
    "id": 141,
    "name": "Grivna ucraniana",
    "symbol": "₴"
  },
  {
    "id": 142,
    "name": "Chelín ugandés",
    "symbol": "USh"
  },
  {
    "id": 143,
    "name": "Dólar estadounidense",
    "symbol": "$"
  },
  {
    "id": 144,
    "name": "Peso uruguayo",
    "symbol": "$"
  },
  {
    "id": 145,
    "name": "Som uzbeko",
    "symbol": "сум"
  },
  {
    "id": 146,
    "name": "Bolívar venezolano",
    "symbol": "Bs."
  },
  {
    "id": 147,
    "name": "Đồng vietnamita",
    "symbol": "₫"
  },
  {
    "id": 148,
    "name": "Vatu de Vanuatu",
    "symbol": "Vt"
  },
  {
    "id": 149,
    "name": "Tala samoano",
    "symbol": "T"
  },
  {
    "id": 150,
    "name": "Franco CFA de África Central",
    "symbol": "FCFA"
  },
  {
    "id": 151,
    "name": "Dólar del Caribe Oriental",
    "symbol": "EC$"
  },
  {
    "id": 152,
    "name": "Franco CFA de África Occidental",
    "symbol": "CFA"
  },
  {
    "id": 153,
    "name": "Franco CFP",
    "symbol": "₣"
  },
  {
    "id": 154,
    "name": "Rial yemení",
    "symbol": "﷼"
  },
  {
    "id": 155,
    "name": "Rand sudafricano",
    "symbol": "R"
  },
  {
    "id": 156,
    "name": "Kwacha zambiano",
    "symbol": "ZK"
  },
  {
    "id": 157,
    "name": "Dólar zimbabuense",
    "symbol": "Z$"
  },
  {
    "id": 158,
    "name": "Franco CFA (BCEAO)",
    "symbol": "CFA"
  },
  {
    "id": 159,
    "name": "Franco CFA (BEAC)",
    "symbol": "FCFA"
  },
  {
    "id": 160,
    "name": "Corona feroesa",
    "symbol": "kr"
  },
  {
    "id": 161,
    "name": "Libra de la Isla de Man",
    "symbol": "£"
  },
  {
    "id": 162,
    "name": "Libra de Jersey",
    "symbol": "£"
  },
  {
    "id": 163,
    "name": "Dólar kiribatiano",
    "symbol": "$"
  },
  {
    "id": 164,
    "name": "Dólar tuvaluano",
    "symbol": "$"
  },
  {
    "id": 165,
    "name": "Dólar de las Islas Cook",
    "symbol": "$"
  },
  {
    "id": 166,
    "name": "Dólar de Niue",
    "symbol": "$"
  }
]
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
