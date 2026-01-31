document.addEventListener('DOMContentLoaded', function () {
    const checkbox = document.getElementById('agreeRule');
    const payButton = document.querySelector('.servbuton2');
    if (!checkbox || !payButton) return;
    const updateState = () => {
        const disabled = !checkbox.checked;
        payButton.disabled = disabled;
        payButton.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        payButton.style.cursor = disabled ? 'not-allowed' : 'pointer';
        payButton.classList.toggle('servbuton2--disabled', disabled);
    };
    // ensure initial state
    updateState();
    checkbox.addEventListener('change', updateState);
});
