function addToCart(productId) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/add-to-cart/${productId}`);
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('Product added to cart!');
        } else {
            console.log('Failed to add product to cart.');
        }
    };
    xhr.send();
}
