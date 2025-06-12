function SliderTestimonials() {
    const swiper = new Swiper('.testimonials-slider', {
        direction: 'horizontal',
        loop: true, 
        slidesPerView: 'auto',
        spaceBetween: '120',
        centeredSlides: true,
        pagination: {
            el: '.testimonial-pagination',
            clickable: true,
        }
    })
}
  
export default function init() {
  SliderTestimonials();
}  