const options = `
        width=600,
        height=790,
        directories=no,
        titlebar=no
        toolbar=no,
        location=no,
        status=no,
        menubar=no,
        scrollbars=no,
        resizable=no
      `;

export const windowOpen = (url: string) => {
  if (navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i)) {
    // mobile
    window.location.replace(url);
    return null;
  } else {
    // pc
    const top = (window.screen.availHeight - 790) / 2;
    const left = (window.screen.availWidth - 600) / 2;
    return window.open(url, "_blank", `${options},top=${top},left=${left}`);
  }
};
