const initialStock = {
    mleko: 30,
    espresso: 30,
    coffee: 30,
    long: 30,
    doppio: 30
};

let stock = { ...initialStock };
let usageCount = 0;

function updateStockAndClean() {
    const mleko = parseInt(document.getElementById('mleko').value);
    const espresso = parseInt(document.getElementById('espresso').value);
    const coffee = parseInt(document.getElementById('coffee').value);
    const long = parseInt(document.getElementById('long').value);
    const doppio = parseInt(document.getElementById('doppio').value);

    const isCoffeeSelected = espresso > 0 || coffee > 0 || long > 0 || doppio > 0 || mleko > 0;

    if (!isCoffeeSelected) {
        alert("Musíte vybrat alespoň jednu kávu.");
        return;
    }

    if (mleko > stock.mleko || espresso > stock.espresso || coffee > stock.coffee || long > stock.long || doppio > stock.doppio) {
        let missingItems = [];
        if (mleko > stock.mleko) missingItems.push("mléko");
        if (espresso > stock.espresso) missingItems.push("espresso");
        if (coffee > stock.coffee) missingItems.push("coffee");
        if (long > stock.long) missingItems.push("long");
        if (doppio > stock.doppio) missingItems.push("doppio");

        alert("Nedostatek zásob: " + missingItems.join(", "));
        return;
    }

    stock.mleko -= mleko;
    stock.espresso -= espresso;
    stock.coffee -= coffee;
    stock.long -= long;
    stock.doppio -= doppio;

    usageCount++;

    const cleaningNeeded = usageCount % 40 === 0;

    updateFooter(cleaningNeeded);
}

function updateFooter(cleaningNeeded) {
    const footer = document.querySelector('.burza');
    footer.querySelector('p:nth-of-type(1)').textContent = cleaningNeeded 
        ? 'Nutné čištění za 0 dní' 
        : `Nutné čištění za ${40 - (usageCount % 40)} dní`;

    updateStockDisplay(footer.querySelector('p:nth-of-type(2)'), stock.mleko, 'Zásoba mléko:');
    updateStockDisplay(footer.querySelector('p:nth-of-type(3)'), stock.espresso, 'Zásoba espresso:');
    updateStockDisplay(footer.querySelector('p:nth-of-type(4)'), stock.coffee, 'Zásoba coffee:');
    updateStockDisplay(footer.querySelector('p:nth-of-type(5)'), stock.long, 'Zásoba long:');
    updateStockDisplay(footer.querySelector('p:nth-of-type(6)'), stock.doppio, 'Zásoba doppio:');
}

function updateStockDisplay(element, stockAmount, label) {
    element.textContent = `${label} ${stockAmount}`;
    if (stockAmount > 20) {
        element.style.color = 'green';
    } else if (stockAmount > 10) {
        element.style.color = 'orange';
    } else {
        element.style.color = 'red';
    }
}

document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    updateStockAndClean();
});

updateFooter(false);
