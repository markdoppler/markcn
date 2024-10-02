import chalk from 'chalk';

// Definir estilos para cada tipo de log
const tags = {
    info: chalk.hex('#FFE400'),  // Color amarillo para "INFO"
    npm: chalk.hex('#4ADE80'),   // Color azul para "NPM"
    write: chalk.hex('#007ACC'), // Color verde para "WRITE"
    error: chalk.hex('#FF0000'), // Color rojo para "ERROR"
    env: chalk.hex('#FF00FF'),   // Color morado para "ENV"
};

// Función para ajustar el tamaño de la etiqueta
function formatLabel(label) {
    const maxLength = 5; // Tamaño fijo de la etiqueta
    return label.padEnd(maxLength); // No centrar, solo agregar espacios a la derecha
}

// Función para loguear mensajes con estilo
function logMessage(message, tag = 'info') {

    tag = tag || 'info';

    const color = tags[tag] ? tags[tag] : tags.info; // Si el tag no existe, usar "info"
    
    const formattedTag = formatLabel(tag.toUpperCase()); // Formatea el tag
    const styledTag = color(formattedTag); // Aplica el estilo al tag

    // Agregamos una línea divisoria para un estilo más limpio y profesional
    const separator = chalk.hex('#D3D3D3')('│'); // Línea vertical gris

    // Si no se proporciona color, usar el color del tag
    const messageColor = color(message);

    // Formateamos el mensaje con el color definido o el del tag
    console.log(`${styledTag} ${separator} ${messageColor}`);
}

export { logMessage };
