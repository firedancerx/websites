<script>
    (() => {
        const titleInput = document.querySelector('[data-title-case]');
        const slugInput = document.querySelector('[data-slug]');
        const phoneInput = document.querySelector('[data-phone-dash]');
        const upperInput = document.querySelector('[data-upper-case]');
        let slugEdited = Boolean(slugInput?.value);

        const toTitleCase = (value) => value
            .toLowerCase()
            .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

        const toSlug = (value) => value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        titleInput?.addEventListener('input', () => {
            titleInput.value = toTitleCase(titleInput.value);

            if (!slugEdited && slugInput) {
                slugInput.value = toSlug(titleInput.value);
            }
        });

        slugInput?.addEventListener('input', () => {
            slugEdited = true;
            slugInput.value = toSlug(slugInput.value);
        });

        phoneInput?.addEventListener('input', () => {
            const digits = phoneInput.value.replace(/\D+/g, '');
            phoneInput.value = digits.length > 3
                ? `${digits.slice(0, 3)}-${digits.slice(3)}`
                : digits;
        });

        upperInput?.addEventListener('input', () => {
            upperInput.value = upperInput.value.toUpperCase();
        });
    })();
</script>
