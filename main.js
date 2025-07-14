const listaTipos = document.querySelector(".filtro_tipos_container")
const allpokemon = document.querySelector('.container')
const showMoreButton = document.querySelector('#showMore')
const searchButton = document.getElementById('searchButton')
const menuToggle = document.getElementById('menuToggle')
const menu = document.getElementById('navbar')
const mainTitle = document.getElementById('main-title'); // Elemento del título principal

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
    
    showMoreButton.style.display = "block"
    
    const pokemonPromises = pokemonList.map(async (pokemon) => {
        const res = await fetch(pokemon.url);
        if (!res.ok) {
            throw new Error(`Error: ${res.status} - ${res.statusText}`);
        }
        return res.json();
    });

    const pokemonInfos = await Promise.all(pokemonPromises);

    pokemonInfos.sort((a, b) => a.id - b.id); 

    pokemonInfos.forEach(pokemonInfo => {
        generatePokemonCard(pokemonInfo);
    });
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
    pokemonList.forEach(async (pokemonData) => {
        const name = pokemonData.pokemon.name;
        const url = pokemonData.pokemon.url;
        const pokemonResponse = await fetch(url);
        if (!pokemonResponse.ok) {
            throw new Error(`Error: ${pokemonResponse.status} - ${pokemonResponse.statusText}`);
        }
        const pokemon = await pokemonResponse.json();
        
        generatePokemonCard(pokemon)
    });
    showMoreButton.style.display= "none"
}

function allfunction() {
    allpokemon.innerHTML = ""
    obtenerPokemons()
    clearClasses()
}

function generatePokemonCard(info, isSearch = false){
    const pokemonSprite = info.sprites.front_default;
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

function generatePokemonDetailsTemplate(pokemonData, description){
    try{

        
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
                <h1 class="detail-name poppins">${pokemonData.name.toUpperCase()}</h1>
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
                    </section>
        </article>
    `;
    }catch(error){
        console.error("error " + error)
    }
}

async function renderPokemonDetails(pokemonId) {
     console.log("hasta aqui");
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await response.json()
    const speciesUrl = data.species.url;
        const speciesResponse = await fetch(speciesUrl);
        const speciesData = await speciesResponse.json();

        const flavorTexts = speciesData.flavor_text_entries; 

        let description = flavorTexts.find(entry => entry.language.name === 'en');
        description = description.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ');
    const datailsTemplate = generatePokemonDetailsTemplate(data, description)
//${description}
    mainTitle.style.display = "none"
    allpokemon.innerHTML = datailsTemplate;
    const backBtn = document.getElementById('back-button')
    backBtn.addEventListener('click', () => {
        backBtn.parentElement.remove()
        filtertypes(currentTypeFilter)
        obtenerPokemons()
        mainTitle.style.display = "block"
    });

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