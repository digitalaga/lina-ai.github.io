<?php
// Set the folder where images will be stored
$uploadFolder = 'pics/';

// Get the image data and name from the request
$imageData = json_decode(file_get_contents('php://input'), true);
$imageDataURL = $imageData['image'];
$imageName = $imageData['name'];

// Remove the "data:image/png;base64," prefix from the data URL
$imageData = substr($imageDataURL, strpos($imageDataURL, ',') + 1);
// Decode the base64-encoded image data
$imageData = base64_decode($imageData);

// Check if the folder exists, if not, create it
if (!file_exists($uploadFolder)) {
    mkdir($uploadFolder, 0777, true);
}

// Save the image to the upload folder
$imagePath = $uploadFolder . $imageName;
file_put_contents($imagePath, $imageData);

// Respond with a JSON object indicating success
echo json_encode(['success' => true, 'path' => $imagePath]);
?>
