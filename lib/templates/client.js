document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function showSlide(index) {
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        currentSlide = index;
        window.location.hash = `slide-${index + 1}`;
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
            nextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            prevSlide();
        }
    });

    // Hash change handling
    function handleHash() {
        const hash = window.location.hash;
        const match = hash.match(/slide-(\d+)/);
        if (match) {
            showSlide(parseInt(match[1]) - 1);
        } else {
            showSlide(0);
        }
    }

    window.addEventListener('hashchange', handleHash);
    handleHash(); // Initial load
});
