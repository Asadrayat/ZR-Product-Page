// comment

class ProductInformation extends HTMLElement {
    constructor() {
      super();
      this.data = {};
      this.productId = this.dataset.productId;
      this.initThumbSlider();
      this.handleEvents();
    }
  
    connectedCallback() {
      this.querySelector("product-variant-picker").addEventListener(
        "input",
        this.handleVariantInput.bind(this)
      );
  
      new Accordion(".prod-info-accrodion-" + this.productId, {
        closeAll: true,
        initOpenIndex: 1,
        duration: 700,
        activeClass: "active",
      });
  
      this.productData = this.handlePreloadData();
      this.hadnlePreloadVariantsData();
      this.handleActiveSlide(this.dataset.selectedImage);
    }
  
    handlePreloadData() {
      try {
        let scriptTag = document.querySelector(
          `script[type="application/json-${this.dataset.productId}"]`
        );
        let jsonData = JSON.parse(scriptTag.textContent);
        console.log("product data: ", jsonData);
        return jsonData;
      } catch (err) {
        return null;
      }
    }
  
    hadnlePreloadVariantsData() {
      if (this.productData) {
        this.productData?.variants?.map(async (variant) => {
          const response = await fetch(
            this.dataset.url + "?variant=" + variant.id
          );
          const data = await response.text();
          const html = new DOMParser().parseFromString(data, "text/html");
          variant.parse_html = data;
        });
      }
    }
  
    handleEvents() {
      this.querySelector("form").addEventListener(
        "submit",
        this.handleAddToCart.bind(this)
      );
    }
  
    handleAddToCart(e) {
      console.log("add to cart 1");
      e.preventDefault();
      let btn = this.querySelector('button[type="submit"]');
      if (btn) {
        btn.classList.add("loading");
        btn.textContent = "Adding To Cart ...";
        btn.style.pointerEvents = "none";
        btn.style.opacity = ".7";
      }
  
      this.cart =
        document.querySelector("cart-notification") ||
        document.querySelector("cart-drawer");
  
      let addToCartForm = this.querySelector('form[action$="/cart/add"]');
      let formData = new FormData(addToCartForm);
  
      if (this.cart) {
        formData.append(
          "sections",
          this.cart.getSectionsToRender().map((section) => section.id)
        );
      }
  
      fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.cart.renderContents(response);
        })
        .finally(() => {
          if (btn) {
            btn.classList.remove("loading");
            btn.textContent = "Add To Cart";
            btn.style.pointerEvents = "unset";
            btn.style.opacity = "1";
          }
          if (document.querySelector(".header__icon--cart"))
            document.querySelector(".header__icon--cart").click();
  
          if (this.cart && this.cart.classList.contains("is-empty"))
            this.cart.classList.remove("is-empty");
        });
    }
  
    handleVariantInput(e) {
      const { url, imageId } = e.target?.dataset;
  
      // this.querySelector("product-variant-picker").style.pointerEvents = "none";
      this.querySelector("product-variant-picker").style.opacity = "1";
  
      this.newRender(this.getCurrentVariant());
  
      this.handleOptins(url, imageId);
    }
  
    getCurrentVariant() {
      try {
        const selectedOptions = Array.from(
          this.querySelectorAll("product-variant-picker .p-info-variants-option")
        )
          .map((option) => {
            const checkedInput = option?.querySelector("input:checked");
            return checkedInput?.value;
          })
          .filter(Boolean);
  
        if (!selectedOptions.length) {
          console.warn("No variants selected");
          return null;
        }
  
        if (!this.productData?.variants) {
          console.error("Product data not available");
          return null;
        }
  
        const matchingVariant = this.productData.variants.find((variant) =>
          selectedOptions.every(
            (option, index) => variant.options[index] === option
          )
        );
  
        if (!matchingVariant) {
          console.warn("No matching variant found for options:", selectedOptions);
        }
  
        return matchingVariant || null;
      } catch (error) {
        console.error("Error in getCurrentVariant:", error);
        return null;
      }
    }
  
    handleOptins(url = null, imageId = null) {
      if (imageId && imageId !== null) this.handleActiveSlide(imageId);
      if (url && url !== null) this.handleOptions(url);
    }
  
    handleOptions(url) {
      if (!url || url === null) return;
  
      this.updateURL(url);
      this.handleQuickAdd(url);
      // this.render(url);
    }
  
    handleQuickAdd(url) {
      const gcv = this.productData.variants.find((variant) =>
        url.includes(variant.id.toString())
      );
      if (gcv) this.newRender(gcv);
    }
  
    updateURL(url) {
      if (this.dataset.updateUrl === "false") return null;
      window.history.pushState({}, "", url);
    }
  
    newRender(variant) {
      console.log("current Variant: ", variant);
      const html = new DOMParser().parseFromString(
        variant.parse_html,
        "text/html"
      );
  
      if (
        this.querySelector("product-variant-picker") &&
        html.querySelector("product-variant-picker")
      ) {
        this.querySelector("product-variant-picker").innerHTML =
          html.querySelector("product-variant-picker").innerHTML;
      }
  
      console.log("new rdner", html.querySelector(".product-details-new"))
      console.log("new rdner", document.querySelector(".product-details-new"))
      
      if (
        document.querySelector(".product-details-new") &&
        html.querySelector(".product-details-new")
      ) {
        document.querySelector(".product-details-new").innerHTML =
          html.querySelector(".product-details-new").innerHTML;
      }
  
      if (this.querySelectorAll(".p-info-title")) {
        this.querySelectorAll(".p-info-title").forEach((el) => {
          el.innerHTML = html.querySelector(".p-info-title").innerHTML;
        });
      }
  
      if (this.querySelectorAll(".p-info-price")) {
        this.querySelectorAll(".p-info-price").forEach((el) => {
          el.innerHTML = html.querySelector(".p-info-price").innerHTML;
        });
      }
  
      if (this.querySelector("product-info-form")) {
        this.querySelector("product-info-form").innerHTML =
          html.querySelector("product-info-form").innerHTML;
        if (window.Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }
      }
      if (document.querySelector("pqa-new")) {
        document.querySelector("pqa-new").innerHTML =
          html.querySelector("pqa-new").innerHTML;
      }
  
      this.handleEvents();
      this.querySelector("product-variant-picker").style.pointerEvents =
        "inherit";
      this.querySelector("product-variant-picker").style.opacity = "1";
      sizeGuide();
      pd_accordion()
    }
  
    async render(url) {
      let newUrl = url.includes("?")
        ? url + "&section=product-information-v2"
        : url + "?section=product-information-v2";
  
      const response = await fetch(newUrl);
      const data = await response.text();
      const html = new DOMParser().parseFromString(data, "text/html");
  
      if (
        this.querySelector("product-variant-picker") &&
        html.querySelector("product-variant-picker")
      ) {
        this.querySelector("product-variant-picker").innerHTML =
          html.querySelector("product-variant-picker").innerHTML;
      }
  
      if (this.querySelectorAll(".p-info-title")) {
        this.querySelectorAll(".p-info-title").forEach((el) => {
          el.innerHTML = html.querySelector(".p-info-title").innerHTML;
        });
      }
  
      if (this.querySelectorAll(".p-info-price")) {
        this.querySelectorAll(".p-info-price").forEach((el) => {
          el.innerHTML = html.querySelector(".p-info-price").innerHTML;
        });
      }
  
      if (this.querySelector("product-info-form")) {
        this.querySelector("product-info-form").innerHTML =
          html.querySelector("product-info-form").innerHTML;
        if (window.Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }
      }
      if (document.querySelector("pqa-new")) {
        document.querySelector("pqa-new").innerHTML =
          html.querySelector("pqa-new").innerHTML;
      }
  
      this.handleEvents();
      this.querySelector("product-variant-picker").style.pointerEvents =
        "inherit";
      this.querySelector("product-variant-picker").style.opacity = "1";
      window.sizeGuide();
    }
  
    handleActiveSlide(imageId) {
      if (!imageId || imageId === null) return;
      let activeSlide = this.querySelector(
        `.p-info-thumb .swiper-slide[data-image-id="${imageId}"]`
      );
      if (activeSlide) this.gotoActiveSlide(activeSlide.dataset?.index);
    }
  
    gotoActiveSlide(index) {
      if (index && this.thumbSwiper) this.thumbSwiper.slideTo(index);
    }
  
    initThumbSlider() {
      this.thumbSwiperConfig = {
        slidesPerView: "auto",
        spaceBetween: 0,
        autoHeight: true,
        loop: true,
        grabCursor: true,
        freeMode: true,
        // autoplay: {
        //   delay: 0
        // },
        // speed: 1000,
        breakpoints: {
          100: {
            slidesPerView: 1.2,
            autoHeight: true,
            spaceBetween: 1,
          },
          500: {
            slidesPerView: 1.5,
            spaceBetween: 0,
            autoHeight: true,
          },
          769: {
            slidesPerView: "auto",
            spaceBetween: 0,
          },
        },
      };
      this.thumbSwiper = new Swiper(
        this.querySelector(".p-info-thumb"),
        this.thumbSwiperConfig
      );
  
      if (this.dataset.selectedImageId) {
        this.handleActiveSlide(this.dataset.selectedImageId);
      }
    }
  }
  
  class ProductQuickAdd extends HTMLElement {
    constructor() {
      super();
  
      this.addEventListener("input", this.handleVariantInput.bind(this));
      this.addEventListener("click", this.handleSubmitEvemt.bind(this));
    }
  
    handleVariantInput(e) {
      const { value } = e.target;
      if (document.querySelector("product-information"))
        document.querySelector("product-information").handleOptins(value);
    }
  
    handleSubmitEvemt(e) {
      if (e.target.closest("form")) {
        e.preventDefault();
      }
  
      if (e.target.tagName === "BUTTON") {
        this.handleAddToCart(e.target.closest("form"), e.target);
      }
    }
  
    handleAddToCart(form, btn) {
      if (!form) return;
  
      if (btn) {
        btn.classList.add("loading");
        btn.textContent = "Adding To Cart ...";
        btn.style.pointerEvents = "none";
        btn.style.opacity = ".7";
      }
  
      this.cart =
        document.querySelector("cart-notification") ||
        document.querySelector("cart-drawer");
  
      let formData = new FormData(form);
  
      if (this.cart) {
        formData.append(
          "sections",
          this.cart.getSectionsToRender().map((section) => section.id)
        );
      }
  
      fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.cart.renderContents(response);
        })
        .finally(() => {
          if (btn) {
            btn.classList.remove("loading");
            btn.textContent = "Add To Cart";
            btn.style.pointerEvents = "unset";
            btn.style.opacity = "1";
          }
          if (document.querySelector(".header__icon--cart"))
            document.querySelector(".header__icon--cart").click();
  
          if (this.cart && this.cart.classList.contains("is-empty"))
            this.cart.classList.remove("is-empty");
        });
    }
  }
  
  document.addEventListener("DOMContentLoaded", (e) => {
    customElements.define("product-information", ProductInformation);
    customElements.define("pqa-new", ProductQuickAdd);
  });
  
  // class ProductInformation extends HTMLElement {
  //   constructor() {
  //     super();
  //     this.productId = this.dataset.productId
  //     this.initThumbSlider();
  //     this.handleEvents();
  //   }
  
  //   connectedCallback() {
  //     this.querySelector("product-variant-picker").addEventListener(
  //       "input",
  //       this.handleVariantInput.bind(this)
  //     );
  
  //     new Accordion(".prod-info-accrodion-"+this.productId, {
  //       closeAll: true,
  //       initOpenIndex: 1,
  //       duration: 700,
  //       activeClass: "active",
  //     });
  //   }
  
  //   handleEvents() {
  //     this.querySelector("form").addEventListener(
  //       "submit",
  //       this.handleAddToCart.bind(this)
  //     );
  //   }
  
  //   handleAddToCart(e) {
  //     e.preventDefault();
  //     let btn = this.querySelector('button[type="submit"]');
  //     if (btn) {
  //       btn.classList.add("loading");
  //       btn.textContent = "Adding To Cart ...";
  //       btn.style.pointerEvents = "none";
  //       btn.style.opacity = ".7";
  //     }
  //     let addToCartForm = this.querySelector('form[action$="/cart/add"]');
  //     let formData = new FormData(addToCartForm);
  
  //     fetch(window.Shopify.routes.root + "cart/add.js", {
  //       method: "POST",
  //       body: formData,
  //     })
  //       .then((response) => {
  //         return response.json();
  //       })
  //       .finally(() => {
  //         if (btn) {
  //           btn.classList.remove("loading");
  //           btn.textContent = "Add To Cart";
  //           btn.style.pointerEvents = "unset";
  //           btn.style.opacity = "1";
  //         }
  //         if (document.querySelector(".header__icon--cart"))
  //           document.querySelector(".header__icon--cart").click();
  //       });
  //   }
  
  //   handleVariantInput(e) {
  //     const { url, imageId } = e.target?.dataset;
  
  //     this.querySelector("product-variant-picker").style.pointerEvents = "none";
  //     this.querySelector("product-variant-picker").style.opacity = "1";
  
  //     this.handleOptins(url, imageId);
  //   }
  
  //   handleOptins(url = null, imageId = null) {
  //     if (imageId && imageId !== null) this.handleActiveSlide(imageId);
  //     if (url && url !== null) this.handleOptions(url);
  //   }
  
  //   handleOptions(url) {
  //     if (!url || url === null) return;
  
  //     this.updateURL(url);
  //     this.render(url);
  //   }
  
  //   updateURL(url) {
  //     if (this.dataset.updateUrl === "false") return null;
  //     window.history.pushState({}, "", url);
  //   }
  
  //   async render(url) {
  //     const response = await fetch(url);
  //     const data = await response.text();
  //     const html = new DOMParser().parseFromString(data, "text/html");
  
  //     if (this.querySelector("product-variant-picker")) {
  //       this.querySelector("product-variant-picker").innerHTML =
  //         html.querySelector("product-variant-picker").innerHTML;
  //     }
  
  //     if (this.querySelectorAll(".p-info-title")) {
  //       this.querySelectorAll(".p-info-title").forEach((el) => {
  //         el.innerHTML = html.querySelector(".p-info-title").innerHTML;
  //       });
  //     }
  
  //     if (this.querySelectorAll(".p-info-price")) {
  //       this.querySelectorAll(".p-info-price").forEach((el) => {
  //         el.innerHTML = html.querySelector(".p-info-price").innerHTML;
  //       });
  //     }
  
  //     if (this.querySelector("product-info-form")) {
  //       this.querySelector("product-info-form").innerHTML =
  //         html.querySelector("product-info-form").innerHTML;
  //       if (window.Shopify && Shopify.PaymentButton) {
  //         Shopify.PaymentButton.init();
  //       }
  //     }
  //     if (document.querySelector("pqa-new")) {
  //       document.querySelector("pqa-new").innerHTML =
  //         html.querySelector("pqa-new").innerHTML;
  //     }
  
  //     this.handleEvents();
  //     this.querySelector("product-variant-picker").style.pointerEvents =
  //       "inherit";
  //     this.querySelector("product-variant-picker").style.opacity = "1";
  //     window.sizeGuide();
  //   }
  
  //   handleActiveSlide(imageId) {
  //     if (!imageId || imageId === null) return;
  //     this.slides = this.querySelectorAll(".p-info-thumb .swiper-slide");
  //     if (this.slides) {
  //       this.slides.forEach((slide, index) => {
  //         if (slide.dataset?.imageId === imageId) {
  //           const activeIndex = slide.dataset?.swiperSlideIndex;
  //           this.gotoActiveSlide(index);
  //         }
  //       });
  //     }
  //   }
  
  //   gotoActiveSlide(index) {
  //     if (index && this.thumbSwiper) this.thumbSwiper.slideTo(index);
  //   }
  
  //   initThumbSlider() {
  //     this.thumbSwiperConfig = {
  //       slidesPerView: "auto",
  //       spaceBetween: 0,
  //       autoHeight: true,
  //       loop: true,
  //       grabCursor: true,
  //       freeMode: true,
  //       // autoplay: {
  //       //   delay: 0
  //       // },
  //       speed: 1000,
  //       breakpoints: {
  //         100: {
  //           slidesPerView: 1.2,
  //           autoHeight: true,
  //         },
  //         500: {
  //           slidesPerView: 1.5,
  //           spaceBetween: 0,
  //           autoHeight: true,
  //         },
  //         769: {
  //           slidesPerView: "auto",
  //           spaceBetween: 0,
  //         },
  //       },
  //     };
  //     this.thumbSwiper = new Swiper(
  //       this.querySelector(".p-info-thumb"),
  //       this.thumbSwiperConfig
  //     );
  
  //     if (this.dataset.selectedImageId) {
  //       this.handleActiveSlide(this.dataset.selectedImageId);
  //     }
  //   }
  // }
  
  // class ProductQuickAdd extends HTMLElement {
  //   constructor() {
  //     super();
  
  //     this.addEventListener("input", this.handleVariantInput.bind(this));
  //     this.addEventListener("click", this.handleSubmitEvemt.bind(this));
  //   }
  
  //   handleVariantInput(e) {
  //     const { value } = e.target;
  //     if (document.querySelector("product-information"))
  //       document.querySelector("product-information").handleOptins(value);
  //   }
  
  //   handleSubmitEvemt(e) {
  //     if (e.target.closest("form")) {
  //       e.preventDefault();
  //     }
  
  //     if (e.target.tagName === "BUTTON") {
  //       this.handleAddToCart(e.target.closest("form"), e.target);
  //     }
  //   }
  
  //   handleAddToCart(form, btn) {
  //     if (!form) return;
  
  //     if (btn) {
  //       btn.classList.add("loading");
  //       btn.textContent = "Adding To Cart ...";
  //       btn.style.pointerEvents = "none";
  //       btn.style.opacity = ".7";
  //     }
  
  //     let formData = new FormData(form);
  
  //     fetch(window.Shopify.routes.root + "cart/add.js", {
  //       method: "POST",
  //       body: formData,
  //     })
  //       .then((response) => {
  //         return response.json();
  //       })
  //       .finally(() => {
  //         if (btn) {
  //           btn.classList.remove("loading");
  //           btn.textContent = "Add To Cart";
  //           btn.style.pointerEvents = "unset";
  //           btn.style.opacity = "1";
  //         }
  //         if (document.querySelector(".header__icon--cart"))
  //           document.querySelector(".header__icon--cart").click();
  //       });
  //   }
  // }
  
  // document.addEventListener("DOMContentLoaded", (e) => {
  //   customElements.define("product-information", ProductInformation);
  //   customElements.define("pqa-new", ProductQuickAdd);
  // });
  