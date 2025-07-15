const listaTipos = document.querySelector(".filtro_tipos_container")
const allpokemon = document.querySelector('.container')
const showMoreButton = document.querySelector('#showMore')
const searchButton = document.getElementById('searchButton')
const menuToggle = document.getElementById('menuToggle')
const menu = document.getElementById('navbar')
const mainTitle = document.getElementById('main-title'); // Elemento del título principal
const subitBTn = document.getElementById('subir')

let limit
let offset = 0
let currentTypeFilter = null;
async function obtenerInfoTipos(url=`https://pokeapi.co/api/v2/type`) {
    try{
        const llamada = await fetch(url)
        if (!llamada.ok) {
            throw new Error(`Error: ${llamada.status} - ${llamada.statusText}`);
        }
        const data = await llamada.json()
        const tipos = data.results.map(tipo => tipo.name)
        tipos.forEach(element => {
            // Se añade una condición para excluir los tipos "unknown" y "stellar".
            // El tipo "stellar" es una mecánica de teracristalización y no tiene una lista de Pokémon asociada en la API,
            // por lo que el filtro no funcionaría y es mejor ocultarlo.
            if(element !== "unknown" && element !== "stellar"){
                const li = document.createElement("li");
            li.className = "filtro_tipos"
            const filterButton = document.createElement("button")
            filterButton.className = "filter-button"
            filterButton.textContent = element
            filterButton.classList.add(element)
            li.appendChild(filterButton)
            filterButton.addEventListener('click', (event) => {
                allpokemon.innerHTML = ""
                currentTypeFilter = event.target.dataset.type;
                clearClasses()
                filtertypes(element)
                if(mainTitle.style.display == "none"){
                    mainTitle.style.display = "block"
                }
            })
            listaTipos.appendChild(li)
            }
        });
    }catch(error){
        console.error("NO se puedo obtener informacion del pokemon:", error)
    }
}
obtenerInfoTipos()

async function obtenerPokemons(url=`https://pokeapi.co/api/v2/pokemon?limit=100`) {
    mainTitle.textContent = 'All Pokemons'; // Actualiza el título a "All Pokemons"
    const pokemones = await fetch(url)
    if (!pokemones.ok) {
        throw new Error(`Error: ${pokemones.status} - ${pokemones.statusText}`);
    }
    const data = await pokemones.json()
    const pokemonList = data.results
    
    // mapear la informacion de los resultados y convertirlos en promesas
    const pokemonPromises = pokemonList.map(async (pokemon) => {
        const res = await fetch(pokemon.url);
        if (!res.ok) {
            throw new Error(`Error: ${res.status} - ${res.statusText}`);
        }
        return res.json();
    });
    // esperar a que todas las promesas se terminen y se genera un array
    const pokemonInfos = await Promise.all(pokemonPromises);
    // para ordenar los pokemons de acuerdo a su id
    pokemonInfos.sort((a, b) => a.id - b.id); 
    
    pokemonInfos.forEach(pokemonInfo => {
        generatePokemonCard(pokemonInfo);
    });
    showMoreButton.style.display = "block"
}
obtenerPokemons()

showMoreButton.addEventListener('click', (url)=>{
    if (currentTypeFilter) {
        filtertypes(currentTypeFilter);
        
    } else {
        // Si no hay filtro, carga más pokemones normales
        offset += 100;
        obtenerPokemons(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=50`);
    }})


async function buscarUnPokemon(name) {
    try{
        mainTitle.textContent = `Results for: ${name}` // Actualiza el título con el término de búsqueda
        showMoreButton.style.display = "none";
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        clearClasses()
        const pokemon = await response.json()
        generatePokemonCard(pokemon, true);
    }catch(err){
        alert("Pokemon no encontrado, por favor verifica el nombre")
    }
}

searchButton.addEventListener('click',()=>{
    const searchInput = document.getElementById("search").value
    showMoreButton.disabled = true;
    buscarUnPokemon(searchInput)
})
async function filtertypes(type) {
    mainTitle.textContent = `Type: ${type}`; // Actualiza el título con el tipo de Pokémon filtrado
    currentTypeFilter = type
    const url = `https://pokeapi.co/api/v2/type/${type}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    const pokemonList = data.pokemon
    const info = pokemonList.map(async (pokemonData) => {
        const name = pokemonData.pokemon.name;
        const url = pokemonData.pokemon.url;
        const pokemonResponse = await fetch(url);
        if (!pokemonResponse.ok) {
            throw new Error(`Error: ${pokemonResponse.status} - ${pokemonResponse.statusText}`);
        }
        
        return pokemonResponse.json();
        
    });
    const promise = await Promise.all(info)
    promise.sort((a, b) => a.id - b.id); 
    promise.forEach(pokemon=>{
        generatePokemonCard(pokemon)})
    showMoreButton.style.display= "none"
}

function allfunction() {
    allpokemon.innerHTML = ""
    obtenerPokemons()
    clearClasses()
}

function generatePokemonCard(info, isSearch = false){
    const pokemonSprite = info.sprites.official-artwork.front_default;

    const template = `<div class="pokemon" onclick="renderPokemonDetails(${info.id})">
            <img src="${pokemonSprite}" alt="${info.name}" class="pokemon_img">
            <p class="id">ID: #${info.id.toString().padStart(3, "0")}</p>
            <h3>${info.name}</h3>
            <ul class="pokemon_types">
                ${info.types.map(type => `<li class="pokemon_type ${type.type.name}">${type.type.name}</li>`).join('')}
            </ul>
        </div>`
    
    if(isSearch){
        allpokemon.innerHTML = template
    }else{
        allpokemon.insertAdjacentHTML("beforeend", template);
    }
}

async function generatePokemonDetailsTemplate(pokemonData, description){
    try{
        // Usamos await para esperar a que la promesa de getEvolutionChain se resuelva.
        // Ahora, evolutionChain contendrá el string de HTML directamente, no la promesa.
        const evolutionChain = await getEvolutionChain(pokemonData.id);
        
        showMoreButton.style.display = 'none';
        const formattedId = String(pokemonData.id).padStart(3, "0");
        const typesHtml = pokemonData.types.map(typeInfo => `
            <span class="type-badge ${typeInfo.type.name}">${typeInfo.type.name}</span>
        `).join("");
        const abilitiesHtml = pokemonData.abilities.map(abilityInfo => `
            <li>${abilityInfo.ability.name.replace(/-/g, ' ')}</li>
            `).join('');
            const statsHtml = pokemonData.stats.map(statInfo => {
            const statValue = statInfo.base_stat;
            const maxStat = 255; // Max possible stat value for scaling
            const statPercentage = (statValue / maxStat) * 100;
            return `
                <li class="stat-item">
                    <span class="stat-name">${statInfo.stat.name.replace(/-/g, ' ').replace('special', 'sp.')}</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar" style="width: ${statPercentage}%;"></div>
                    </div>
                    <span class="stat-value">${statValue}</span>
                </li>
            `;
        }).join('');
                
                return `
                <article class="pokemon-detail-view">
                <button id="back-button" class="back-button specialBtn">&larr; Go back</button>
            <section class="detail-header">
                <h2 class="detail-name poppins">${pokemonData.name.toUpperCase()}</h2>
                <span class="detail-id">#${formattedId}</span>
            </section>

            <section class="detail-main">
                <figure class="detail-sprites">
                
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" class="pokemon-main-image">
                    <figcaption class="sprite-gallery">
                        ${pokemonData.sprites.front_shiny ? `<img src="${pokemonData.sprites.front_shiny}" alt="${pokemonData.name} shiny" class="small-sprite">` : ''}
                        ${pokemonData.sprites.back_default ? `<img src="${pokemonData.sprites.back_default}" alt="${pokemonData.name} back" class="small-sprite">` : ''}
                    </figcaption>
                </figure>

                <aside class="detail-info">
                <section class="info-section types-section">
                        <h3 class="poppins">Description</h3>
                        <div class="pokemon-types-detail">
            ${description}
                        </div>
                    </section>
                    <section class="info-section types-section">
                        <h3 class="poppins">Types</h3>
                        <div class="pokemon-types-detail">
                            ${typesHtml}
                        </div>
                    </section>

                    <section class="info-section physical-data">
                        <h3 class="poppins">Physical Data</h3>
                        <p><strong>wight:</strong> ${(pokemonData.weight / 10).toFixed(1)} kg</p>
                        <p><strong>Height:</strong> ${(pokemonData.height / 10).toFixed(1)} m</p>
                    </section>

                    <section class="info-section abilities-section">
                            <h3 class="poppins">Abilities</h3>
                            <ul>${abilitiesHtml}</ul>
                        </section>
                    
                </aside>
            </section>
            <section class="detail-footer">
                    <section class="info-section statistics-section">
                        <h3 class="poppins">Base Statistics</h3>
                        <ul class="stats-list">${statsHtml}</ul>
                    </section>

                    <section class="info-section evolution-chain-section">
                        <h3 class="poppins">Evolution Chain</h3>
                        ${evolutionChain}
                    </section>
            </section>
        </article>
    `;
    }catch(error){
        console.error("error " + error)
    }
}

async function renderPokemonDetails(pokemonId) {
    // Al mostrar los detalles de un Pokémon, nos aseguramos de que la vista se desplace al principio de la página.
    // Esto es importante porque si el usuario ha hecho scroll hacia abajo en la lista,
    // la vista de detalles aparecería a mitad de página, forzando al usuario a subir manualmente.
    
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await response.json()
    const speciesUrl = data.species.url;
    const speciesResponse = await fetch(speciesUrl);
    const speciesData = await speciesResponse.json();
    
    const flavorTexts = speciesData.flavor_text_entries; 
    let description = flavorTexts.find(entry => entry.language.name === 'en');    description = description.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ');    // Como generatePokemonDetailsTemplate ahora es asíncrona, esperamos su resultado con await.    const datailsTemplate = await generatePokemonDetailsTemplate(data, description)    //${description}
    const datailsTemplate = await generatePokemonDetailsTemplate(data, description)
    mainTitle.style.display = "none"
    allpokemon.innerHTML = datailsTemplate;
    const backBtn = document.getElementById('back-button')
    backBtn.addEventListener('click', () => {
        backBtn.parentElement.remove()
        mainTitle.style.display = "block"
        if(currentTypeFilter){
            filtertypes(currentTypeFilter)
            mainTitle.textContent = `Type: ${currentTypeFilter}`
        }else{

            obtenerPokemons()
        }
    });
    goToTop()
    

}

menuToggle.addEventListener("click", ()=>{
    menu.classList.toggle('active')
    menuToggle.classList.toggle('active')
})

function clearClasses(){
    menu.classList.remove('active')
    menuToggle.classList.remove('active')


//logica para que el nav se cierre al hacer click fuera de el
document.addEventListener('click', function(event){
    if(menu.classList.contains('active')){
        // verificamos en que elemento se hico click
        const isClickInsideMenu = menu.contains(event.target)
        const isClickONToggleButton = menuToggle.contains(event.target)
        if(menu.classList.contains('active') && !isClickInsideMenu && !isClickONToggleButton){
            clearClasses()
        }
    }
})
}

// subitBTn.addEventListener('click', goToTop)

 subitBTn.addEventListener('click', goToTop)

function goToTop(){
    // scrollto hace que se desplaze a una seccion en especifico, en este caso no se le pasa
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}

// Esta función controla la visibilidad del botón para subir al inicio.
// Se activa cada vez que el usuario hace scroll.
window.addEventListener('scroll', () => {
    // Buscamos el botón por su ID dentro de esta función.
    const subitBtn = document.getElementById('subir');

    // Si el botón no existe en el DOM por alguna razón, salimos para evitar errores.
    if (!subitBtn) return;

    // Verificamos la posición del scroll vertical.
    // Si el usuario ha bajado más de 400 píxeles, añadimos la clase 'visible'.
    // Si está por encima de esa marca, se la quitamos.
    // Esto hace que el botón aparezca solo cuando es útil.
    if (window.scrollY > 400) { 
        subitBtn.classList.add('visible');
    } else {
        subitBtn.classList.remove('visible');
    }
});

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
