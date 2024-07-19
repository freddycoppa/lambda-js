for (const e of document.getElementsByClassName("dropdown-toggle")) {
    const upIcon = e.dataset.upIcon || '>';
    const downIcon = e.dataset.downIcon || 'v';
    const display = e.dataset.display || 'block';
    const click = function () {
        click.open = !click.open;
        e.textContent = click.open ? downIcon : upIcon;
        document.getElementById(e.dataset.divId).style.display = click.open ? display : 'none';
    }
    click.open = e.dataset.defaultOpen || false;
    e.onclick = click;
}
