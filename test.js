/**
 * Obtiene la cadena de evolución de un Pokémon dado su ID o nombre.
 * @param {string | number} pokemonIdOrName - El ID o nombre del Pokémon.
 * @returns {Promise<Array<Object>>} Una promesa que resuelve a un array de objetos con info de cada etapa de la evolución.
 */
async function getEvolutionChain(pokemonIdOrName) {
    try {
        // Paso 1: Obtener la URL de la cadena de evolución desde la API de especies
        const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonIdOrName}/`;
        const speciesResponse = await fetch(speciesUrl);
        if (!speciesResponse.ok) {
            throw new Error(`Error al obtener datos de la especie para ${pokemonIdOrName}: ${speciesResponse.statusText}`);
        }
        const speciesData = await speciesResponse.json();

        // Verificar si existe la URL de la cadena de evolución
        if (!speciesData.evolution_chain || !speciesData.evolution_chain.url) {
            console.warn(`No se encontró una cadena de evolución para ${pokemonIdOrName}`);
            return []; // Retorna un array vacío si no hay cadena
        }

        const evolutionChainUrl = speciesData.evolution_chain.url;

        // Paso 2: Obtener los datos de la cadena de evolución
        const evoChainResponse = await fetch(evolutionChainUrl);
        if (!evoChainResponse.ok) {
            throw new Error(`Error al obtener la cadena de evolución desde ${evolutionChainUrl}: ${evoChainResponse.statusText}`);
        }
        const evoChainData = await evoChainResponse.json();

        let evolutionLine = [];
        let currentEvolution = evoChainData.chain;

        // Función auxiliar para procesar recursivamente la cadena de evolución
        function traverseEvolution(evolutionNode) {
            // Añadir el Pokémon actual a la línea de evolución
            const speciesName = evolutionNode.species.name;
            const speciesUrl = evolutionNode.species.url; // URL para obtener detalles si es necesario

            evolutionLine.push({
                name: speciesName,
                url: speciesUrl,
                // Puedes añadir más detalles aquí si los necesitas de la species data
                // Por ejemplo, el ID del Pokémon si lo extraes de la URL:
                id: parseInt(speciesUrl.split('/').slice(-2, -1)[0])
            });

            // Si hay evoluciones siguientes
            if (evolutionNode.evolves_to && evolutionNode.evolves_to.length > 0) {
                // Iterar sobre todas las posibles evoluciones (ej. Eevee)
                for (const nextEvolution of evolutionNode.evolves_to) {
                    traverseEvolution(nextEvolution); // Llamada recursiva
                }
            }
        }

        traverseEvolution(currentEvolution);
        return evolutionLine;

    } catch (error) {
        console.error('Error al obtener la cadena de evolución:', error);
        return [];
    }
}

// --- Cómo usarlo ---

// Ejemplo 1: Buscar la cadena de Charmander (ID de Pokémon 4)
// La API de especies para Charmander te dará la evolution_chain_id 2
getEvolutionChain(4)
    .then(chain => {
        console.log("Cadena de evolución para Charmander:", chain);
        // Debería mostrar algo como:
        // [{name: 'charmander', id: 4}, {name: 'charmeleon', id: 5}, {name: 'charizard', id: 6}]
    })
    .catch(error => console.error(error));

// Ejemplo 2: Buscar la cadena de Caterpie (ID de Pokémon 10)
// La API de especies para Caterpie te dará la evolution_chain_id 4
getEvolutionChain(10)
    .then(chain => {
        console.log("Cadena de evolución para Caterpie:", chain);
        // Debería mostrar algo como:
        // [{name: 'caterpie', id: 10}, {name: 'metapod', id: 11}, {name: 'butterfree', id: 12}]
    })
    .catch(error => console.error(error));

// Ejemplo 3: Eevee (tiene múltiples evoluciones)
getEvolutionChain('eevee')
    .then(chain => {
        console.log("Cadena de evolución para Eevee:", chain);
        // Debería mostrar: Eevee, Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon
    })
    .catch(error => console.error(error));