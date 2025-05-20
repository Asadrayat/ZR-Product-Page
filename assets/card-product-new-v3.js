class ProductCard extends HTMLElement {
    constructor() {
      super();
      this.attachEventListeners();
    }
  
    attachEventListeners() {
      // quick view
      if (this.querySelector(".pc-quick-add-btn")) {
        this.querySelector(".pc-quick-add-btn").addEventListener(
          "click",
          this.handleQuickViewEvent.bind(this)
        );
      }
    }
  
    handleQuickViewEvent(e) {
      const { productHandle, variantId } = e.currentTarget.dataset;
      const loadingAnimation = document.getElementById("loading-animation");
      loadingAnimation.classList.add("visible");
  
      fetch(`/products/${productHandle}`)
        .then((res) => res.text())
        .then((res) => {
          const html = new DOMParser().parseFromString(res, "text/html");
          if (html.querySelector("color-variant"))
            html
              .querySelector("color-variant")
              .setAttribute("data-update-url", "false");
          if (html.querySelector("product-information"))
            html
              .querySelector("product-information")
              .setAttribute("data-update-url", "false");
          productQuickView.container.renderContent(
            html.querySelector("#main-product-information").innerHTML
          );
          window.sizeGuide();
          productQuickView.container.open();
        })
        .catch((err) => console.log(err))
        .finally(() => {
          loadingAnimation.classList.remove("visible");
        });
    }
  }
  
  customElements.define("product-card", ProductCard);
  