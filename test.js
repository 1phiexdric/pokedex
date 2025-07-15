async function filtertypes(type) {
    //mainTitle.textContent = `Type: ${type}`; // Actualiza el título con el tipo de Pokémon filtrado
    //currentTypeFilter = type
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

filtertypes('fighting')