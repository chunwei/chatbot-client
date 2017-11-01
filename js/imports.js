const links = document.querySelectorAll('link[rel="import"]')

// Import and add each page to the DOM
Array.prototype.forEach.call(links, function(link) {
  let template = link.import.querySelector('.task-template')
  let clone = document.importNode(template.content, true)
  if (link.href.match('debug-actions-widget.html')) {
    let main_inner = document.querySelector('.main_inner')
    main_inner.insertBefore(clone, main_inner.childNodes[0]); //.appendChild(clone)
  } else {
    document.querySelector('body').appendChild(clone)
  }
})
