/**
 * Obtiene la cadena de evolución de un Pokémon y devuelve una plantilla HTML mejorada.
 * @param {string | number} pokemonIdOrName - El ID o nombre del Pokémon.
 * @returns {Promise<string>} Una promesa que resuelve a un string HTML con la cadena de evolución.
 */
async function getEvolutionChain(pokemonIdOrName) {
    try {
        // Paso 1: Obtener la URL de la cadena de evolución
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonIdOrName}/`);
        if (!speciesResponse.ok) throw new Error(`Error al obtener datos de la especie: ${speciesResponse.statusText}`);
        const speciesData = await speciesResponse.json();

        if (!speciesData.evolution_chain || !speciesData.evolution_chain.url) {
            console.warn(`No se encontró una cadena de evolución para ${pokemonIdOrName}`);
            return ''; // Retorna un string vacío si no hay cadena
        }

        // Paso 2: Obtener los datos de la cadena de evolución
        const evoChainResponse = await fetch(speciesData.evolution_chain.url);
        if (!evoChainResponse.ok) throw new Error(`Error al obtener la cadena de evolución: ${evoChainResponse.statusText}`);
        const evoChainData = await evoChainResponse.json();

        // Paso 3: Recorrer la cadena y recolectar los nombres de los Pokémon
        let evolutionNames = [];
        let currentEvolution = evoChainData.chain;

        function traverseEvolution(evolutionNode) {
            evolutionNames.push(evolutionNode.species.name);
            if (evolutionNode.evolves_to && evolutionNode.evolves_to.length > 0) {
                evolutionNode.evolves_to.forEach(nextEvolution => traverseEvolution(nextEvolution));
            }
        }
        
        traverseEvolution(currentEvolution);

        // Paso 4: Obtener los detalles completos (incluyendo sprites) de cada Pokémon en la cadena
        const pokemonPromises = evolutionNames.map(name => 
            fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(res => res.json())
        );
        const pokemonDetails = await Promise.all(pokemonPromises);

        // Paso 5: Construir la plantilla HTML "cool"
        const evolutionHtml = pokemonDetails.map((pokemon, index) => {
            const isLast = index === pokemonDetails.length - 1;
            
            const stageHtml = `
                <div class="evolution-stage">
                    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="evolution-sprite">
                    <p class="evolution-name">${pokemon.name}</p>
                    <p class="evolution-id">#${String(pokemon.id).padStart(3, '0')}</p>
                </div>
            `;

            // Añadir una flecha de evolución si no es el último Pokémon de la cadena
            const arrowHtml = !isLast ? `<div class="evolution-arrow"><span>&rarr;</span></div>` : '';

            return stageHtml + arrowHtml;
        }).join('');

        return `<div class="evolution-chain-container">${evolutionHtml}</div>`;

    } catch (error) {
        console.error('Error al obtener la cadena de evolución:', error);
        return '<p class="error">Could not load evolution chain.</p>'; // Devuelve un mensaje de error en HTML
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

// // Ejemplo 2: Buscar la cadena de Caterpie (ID de Pokémon 10)
// // La API de especies para Caterpie te dará la evolution_chain_id 4
// getEvolutionChain(10)
//     .then(chain => {
//         console.log("Cadena de evolución para Caterpie:", chain);
//         // Debería mostrar algo como:
//         // [{name: 'caterpie', id: 10}, {name: 'metapod', id: 11}, {name: 'butterfree', id: 12}]
//     })
//     .catch(error => console.error(error));

// // Ejemplo 3: Eevee (tiene múltiples evoluciones)
// getEvolutionChain('eevee')
//     .then(chain => {
//         console.log("Cadena de evolución para Eevee:", chain);
//         // Debería mostrar: Eevee, Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon
//     })
//     .catch(error => console.error(error));