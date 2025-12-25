document.addEventListener('DOMContentLoaded', () => {
    function resizeSlides() {
        const wrappers = document.querySelectorAll('.slide-wrapper');
        const targetWidth = 960;
        const targetHeight = 540;
        const targetAspect = targetWidth / targetHeight;

        wrappers.forEach(wrapper => {
            const slide = wrapper.querySelector('.slide');
            if (!slide) return;
            
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const windowAspect = windowWidth / windowHeight;

            let scale;
            if (windowAspect > targetAspect) {
                // Window is wider than slide, scale to height
                scale = windowHeight / targetHeight;
            } else {
                // Window is narrower than slide, scale to width
                scale = windowWidth / targetWidth;
            }
            
            slide.style.transform = `scale(${scale})`;
        });
    }

    window.addEventListener('resize', resizeSlides);
    
    // Initial resize
    resizeSlides();
    
    // Safety check for delayed rendering
    setTimeout(resizeSlides, 100);
});
