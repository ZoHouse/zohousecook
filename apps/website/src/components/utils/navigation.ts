const scrollToId = (id: string) => {
  const element = document?.getElementById(id);
  if (element) {
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const offset =  window.innerHeight/4; 
    const scrollToPosition = elementTop - offset;

    window.scrollTo({
      top: scrollToPosition,
      behavior: "smooth",
    });
  } else {
    console.warn(`Element with ID "${id}" not found.`);
  }
};

export { scrollToId };

