function insertTimestamp(txtFilePath) {
    // Create the timestamp container if it doesn't exist
    let container = document.getElementById("timestamp-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "timestamp-container";
        container.style.fontSize = "14px";
        container.style.color = "#555";
        container.style.marginTop = "10px";
        document.body.appendChild(container);
    }

    // Fetch timestamp from the text file and inject it into the container
    fetch(txtFilePath)
        .then(response => response.text())
        .then(timestamp => {
            container.innerText = `Last Updated: ${timestamp}`;
            
        })
        .catch(error => console.error("Error fetching timestamp:", error));
}
// Run function automatically when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    insertTimestamp('./timestamp.txt');
});