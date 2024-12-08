console.clear();

const BaseApi = "https://livejs-api.hexschool.io/api/livejs/v1";
const api_path = "t1rosetogether"; //T1 Fighting!!!
const customerApi = `${BaseApi}/customer/${api_path}`;

/* 常量與 DOM 元素選擇 */
const DOM = {
  productWrap: document.querySelector(".productWrap"),
  productSelect: document.querySelector(".productSelect"),
  shoppingCartTableBody: document.querySelector(".shoppingCart-table tbody"),
  totalPrice: document.querySelector(".totalPrice"),
  cleanAllBtn: document.querySelector(".discardAllBtn"),
  orderInfoInputs: document.querySelectorAll("#orderInfo .orderInfo-input"),
  submitOrderBtn: document.querySelector("#orderInfo .orderInfo-btn"),
};

/* API 模組 */
const api = {
  getProducts: () => axios.get(`${customerApi}/products`),
  getCarts: () => axios.get(`${customerApi}/carts`),
  addCart: (data) => axios.post(`${customerApi}/carts`, data),
  updateCart: (data) => axios.patch(`${customerApi}/carts`, data),
  deleteCart: (id) => axios.delete(`${customerApi}/carts/${id}`),
  cleanCarts: () => axios.delete(`${customerApi}/carts`),
  submitOrder: (data) => axios.post(`${customerApi}/orders`, data),
};

/* 初始化 */
let productsData = []; // 商品資料
let cartsData = []; // 購物車資料

function init() {
  showLoading();
  Promise.all([api.getProducts(), api.getCarts()])
    .then(([productsRes, cartsRes]) => {
      productsData = productsRes.data.products;
      cartsData = cartsRes.data;
      renderProducts(productsData);
      renderCarts(cartsData);
    })
    .catch((error) => {
      showError("初始化失敗", error.message);
    })
    .finally(() => {
      hideLoading();
    });
}

init();

/* 渲染商品清單 */
function renderProducts(data) {
  let str = data
    .map(
      (item) => `
      <li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}" alt="">
        <a href="#" class="addCardBtn" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$${item.origin_price}</del>
        <p class="nowPrice">NT$${item.price}</p>
      </li>`
    )
    .join("");
  DOM.productWrap.innerHTML = str;
}

/* 商品篩選器 */
DOM.productSelect.addEventListener("change", function (e) {
  const category = e.target.value;
  const filteredProducts =
    category === "全部"
      ? productsData
      : productsData.filter((item) => item.category === category);
  renderProducts(filteredProducts);
});

/* 新增至購物車 */
DOM.productWrap.addEventListener("click", function (e) {
  e.preventDefault();
  if (e.target.classList.contains("addCardBtn")) {
    const productId = e.target.dataset.id;
    addCart(productId);
  }
});

function addCart(productId) {
  const data = {
    data: { productId: productId, quantity: 1 },
  };
  showLoading();
  api
    .addCart(data)
    .then((response) => {
      cartsData = response.data;
      renderCarts(cartsData);
      showSuccess("成功加入購物車");
    })
    .catch((error) => {
      showError("加入購物車失敗", error.message);
    })
    .finally(() => {
      hideLoading();
    });
}

/* 渲染購物車 */
function renderCarts(data) {
  let str = data.carts
    .map(
      (item) => `
      <tr data-id="${item.id}">
        <td>
          <div class="cardItem-title">
            <img src="${item.product.images}" alt="">
            <p>${item.product.title}</p>
          </div>
        </td>
        <td>NT$${item.product.price}</td>
        <td>
          <button type="button" class="quantityBtn minusBtn"> - </button>
          <span class="quantityNum">${item.quantity}</span>
          <button type="button" class="quantityBtn plusBtn"> + </button>
        </td>
        <td>NT$${item.quantity * item.product.price}</td>
        <td class="discardBtn">
          <a href="#" class="material-icons delete">clear</a>
        </td>
      </tr>`
    )
    .join("");
  DOM.shoppingCartTableBody.innerHTML = str;
  DOM.totalPrice.textContent = `NT$${data.finalTotal}`;
}

/* 清空購物車 */
DOM.cleanAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  showLoading();
  api
    .cleanCarts()
    .then((response) => {
      cartsData = response.data;
      renderCarts(cartsData);
      showSuccess("購物車已全部清除");
    })
    .catch((error) => {
      showError("清空購物車失敗", error.message);
    })
    .finally(() => {
      hideLoading();
    });
});

/* 購物車操作 */
DOM.shoppingCartTableBody.addEventListener("click", function (e) {
  e.preventDefault();
  const cartId = e.target.closest("tr").dataset.id;

  if (e.target.classList.contains("delete")) {
    deleteCart(cartId);
  } else if (e.target.classList.contains("plusBtn")) {
    updateCartQuantity(cartId, 1);
  } else if (e.target.classList.contains("minusBtn")) {
    updateCartQuantity(cartId, -1);
  }
});

function deleteCart(cartId) {
  showLoading();
  api
    .deleteCart(cartId)
    .then((response) => {
      cartsData = response.data;
      renderCarts(cartsData);
      showSuccess("已從購物車清除");
    })
    .catch((error) => {
      showError("刪除失敗", error.message);
    })
    .finally(() => {
      hideLoading();
    });
}

function updateCartQuantity(cartId, change) {
  const cartItem = cartsData.carts.find((item) => item.id === cartId);
  if (!cartItem) return;
  const newQuantity = cartItem.quantity + change;
  if (newQuantity < 1) return;

  const data = { data: { id: cartId, quantity: newQuantity } };
  showLoading();
  api
    .updateCart(data)
    .then((response) => {
      cartsData = response.data;
      renderCarts(cartsData);
    })
    .catch((error) => {
      showError("更新數量失敗", error.message);
    })
    .finally(() => {
      hideLoading();
    });
}

/* 送出訂單 */
DOM.submitOrderBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if ([...DOM.orderInfoInputs].some((input) => input.value === "")) {
    showError("資料尚未填寫完畢");
    return;
  }

  const orderData = {
    data: {
      user: {
        name: DOM.orderInfoInputs[0].value,
        tel: DOM.orderInfoInputs[1].value,
        email: DOM.orderInfoInputs[2].value,
        address: DOM.orderInfoInputs[3].value,
        payment: DOM.orderInfoInputs[4].value,
      },
    },
  };

  showLoading();
  api
    .submitOrder(orderData)
    .then(() => {
      showSuccess("成功送出訂單");
      DOM.orderInfoInputs.forEach((input) => (input.value = ""));
      getCarts();
    })
    .catch((error) => {
      showError("送出訂單失敗", error.message);
    })
    .finally(() => {
      hideLoading();
    });
});

/* Loading 與提示框 */
function showLoading() {
  Swal.fire({
    title: "Loading...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

function hideLoading() {
  Swal.close();
}

function showSuccess(message) {
  Swal.fire({
    icon: "success",
    title: message,
  });
}

function showError(title, message = "") {
  Swal.fire({
    icon: "error",
    title: title,
    text: message,
  });
}
