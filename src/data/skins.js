const male = [
  ['Adventurer', '#d2a35d', 0], ['Jungle Explorer', '#527b48', 0], ['Warrior', '#9c4938', 250],
  ['Royal Prince', '#b69b4d', 400], ['Ninja', '#343947', 500], ['Cyber Warrior', '#4ab9bd', 700],
  ['Fire Warrior', '#d65331', 850], ['Ice Warrior', '#82b8d1', 950], ['Golden Warrior', '#e4bb48', 1200],
  ['Shadow Hunter', '#61566d', 1350], ['Desert Explorer', '#bc8456', 1500], ['Ancient Knight', '#777f70', 1700],
  ['Samurai', '#b33f3f', 1900], ['Pirate', '#805a3b', 2100], ['Superhero', '#4256a6', 2400],
  ['Royal King', '#aa8036', 2700], ['Lava Warrior', '#e6652d', 3000], ['Arctic Explorer', '#91b5bd', 3300],
  ['Futuristic Soldier', '#66a7a0', 3600], ['Temple Guardian', '#d6ad52', 4000],
];
const female = [
  ['Jungle Explorer', '#638a50', 0], ['Royal Princess', '#c77485', 350], ['Ninja', '#4b465f', 550],
  ['Warrior Queen', '#ba6849', 800], ['Golden Guardian', '#d6b24e', 1100], ['Ice Warrior', '#8cb8d3', 1400],
  ['Fire Warrior', '#db623e', 1750], ['Shadow Hunter', '#6c6379', 2100],
  ['Ancient Guardian', '#8a9b70', 2600], ['Legendary Adventurer', '#d19a56', 3200],
];

export const skins = [...male.map(([name, color, price], index) => ({
  id: `m-${index}`, name, gender: 'male', color, price,
})), ...female.map(([name, color, price], index) => ({
  id: `f-${index}`, name, gender: 'female', color, price,
}))];

export const defaultSkin = skins[0];
