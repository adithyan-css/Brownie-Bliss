// OPEN MODAL

function openCustomizer() {
    document.getElementById("customizerModal").style.display = "flex";

    updateTotalPrice();
}


// CLOSE MODAL

function closeCustomizer() {
    document.getElementById("customizerModal").style.display = "none";
}


// UPDATE TOTAL PRICE

function updateTotalPrice() {

    let total = 0;

    // DESSERT PRICE

    const dessert =
        document.getElementById("dessertType").value;

    if (dessert === "Cake") {
        total += 250;
    }
    else {
        total += 150;
    }


    // SIZE PRICE

    const size =
        document.getElementById("size").value;

    if (size === "Medium") {
        total += 100;
    }
    else if (size === "Large") {
        total += 200;
    }
    else if (size === "Party Size") {
        total += 500;
    }


    // TOPPINGS + EXTRAS PRICE

    document
        .querySelectorAll(
            '.checkbox-group input:checked'
        )
        .forEach((item) => {

            total += Number(item.dataset.price);
        });


    // DELIVERY PRICE

    const delivery =
        Number(
            document.getElementById("deliveryDistance").value
        );

    total += delivery;


    // DISPLAY TOTAL

    const totalPriceElement =
    document.getElementById("totalPrice");

if(totalPriceElement){
    totalPriceElement.innerText = total;
}
}



// SUBMIT CUSTOMIZATION

function submitCustomization() {

    const dessert =
        document.getElementById("dessertType").value;

    const flavor =
        document.getElementById("flavor").value;

    const size =
        document.getElementById("size").value;

    const message =
        document.getElementById("message").value;
    
    const address =
        document.getElementById("address").value;

    const occasion =
        document.getElementById("occasion").value;


    // EXTRAS

    const extras = [];

    document
        .querySelectorAll('.extras-group input:checked')
        .forEach((item) => {

            extras.push(item.value);
        });


    // TOPPINGS

    const toppings = [];

    document
        .querySelectorAll(
            '.checkbox-group input:checked'
        )
        .forEach((item) => {

            if (
                !extras.includes(item.value)
            ) {
                toppings.push(item.value);
            }
        });


    // TOTAL PRICE

    const total =
        document.getElementById("totalPrice").innerText;


    // DELIVERY TEXT

    const deliveryValue =
        document.getElementById("deliveryDistance").value;

    const deliveryText =
        deliveryValue == 0
        ? "Free Delivery"
        : "₹100 Delivery Charge";


    // SUMMARY

    const summary = `

    <p><strong>Dessert:</strong> ${dessert}</p>

    <p><strong>Flavor:</strong> ${flavor}</p>

    <p><strong>Size:</strong> ${size}</p>

    <p><strong>Toppings:</strong>
    ${toppings.length ? toppings.join(", ") : "None"}
    </p>

    <p><strong>Occasion:</strong> ${occasion}</p>

    <p><strong>Extras:</strong>
    ${extras.length ? extras.join(", ") : "None"}
    </p>

    <p><strong>Delivery:</strong> ${deliveryText}</p>
    <p><strong>Address:</strong> ${address ? address : "No Address"}</p>

    <p><strong>Message:</strong>
    ${message ? message : "No Message"}
    </p>

    <hr>

    <h3>Total Price: ₹${total}</h3>
    `;


    document.getElementById("orderSummary").innerHTML = summary;
     closeCustomizer();

setTimeout(() => {

    document.getElementById("successPopup").style.display = "flex";

}, 200);
}



// CLOSE SUCCESS POPUP

function closeSuccessPopup() {

    document.getElementById("successPopup").style.display = "none";
}


// LIVE PRICE UPDATE EVENTS

document.addEventListener("DOMContentLoaded", () => {

    const elements = document.querySelectorAll(
        '#customizerModal select, #customizerModal input[type="checkbox"]'
    );

    elements.forEach((element) => {

        element.addEventListener(
            "change",
            updateTotalPrice
        );
    });

    // INITIAL PRICE

    if(document.getElementById("totalPrice")){
        updateTotalPrice();
    }
});