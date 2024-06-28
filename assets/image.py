from PIL import Image, ImageDraw

# Function to create a simple cell image
def create_cell_image(filename, color, text):
    # Create a blank image with white background
    img = Image.new('RGB', (64, 64), (255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Draw a circle (cell)
    d.ellipse([0, 0, 64, 64], fill=color, outline=(0, 0, 0))
    
    # Add text
    d.text((20, 20), text, fill=(0, 0, 0))
    
    # Save image
    img.save(filename)

# Create images
create_cell_image('cell.png', (0, 255, 0), 'C')
create_cell_image('npc.png', (255, 0, 0), 'N')
create_cell_image('sec.png', (0, 0, 255), 'S')

print("Images created successfully.")
