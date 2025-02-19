from reportlab.pdfgen import canvas
from io import BytesIO
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics  
from datetime import datetime

async def generate_receipt_pdf(transaction, transaction_items):
    buffer = BytesIO()

    c = canvas.Canvas(buffer, pagesize=(80 * 2.83, 180 * 2.83))
    width = 80 * 2.83
    height = 180 * 2.83
    x = width / 2
    y = height - 20
    line_height = 12
    margin = 10
    right_margin = width - 10

    pdfmetrics.registerFont(TTFont('DejaVu', 'DejaVuSans.ttf'))
    c.setFont("DejaVu", 12)

    text = "BALAY PANDAY HARDWARE"
    text_width = c.stringWidth(text, "DejaVu", 12)
    c.drawString(x - text_width / 2, y, text)
    y -= line_height * 2

    c.setFont("DejaVu", 10)
    slip_no = f"SLIP# {transaction['slipNo']}"
    text_width = c.stringWidth(slip_no, "DejaVu", 10)
    c.drawString(x - text_width / 2, y, slip_no)
    y -= line_height

    if transaction['customerName']:
        c.drawString(margin, y, f"Customer: {transaction['customerName']}")
        y -= line_height

    transaction_date_str = transaction['transactionDate']
    transaction_date = datetime.strptime(transaction_date_str, '%a, %d %b %Y %H:%M:%S GMT')
    formatted_date = transaction_date.strftime('%B %d, %Y %I:%M %p')
    c.drawString(margin, y, f"Date: {formatted_date}")
    y -= line_height * 2

    c.setFont("DejaVu", 10)
    c.drawString(margin, y, "Items:")
    y -= line_height

    c.line(margin, y, right_margin, y)
    y -= 10

    c.setFont("DejaVu", 9)
    for item in transaction_items:
        item_name = item['name']
        if len(item_name) > 12:
            item_name = item_name[:12] + '...'

        item_line = f"{item['quantity']}x {item_name}"
        amount_line = f"₱ {float(item['price']):.2f} each"
        c.drawString(margin, y, item_line)
        c.drawString(right_margin - 80, y, amount_line)
        y -= line_height

        total_amount = f"₱ {float(item['amount']):.2f}"
        c.drawString(right_margin - 50, y, total_amount)
        y -= line_height

    c.line(margin, y, right_margin, y)
    y -= 10

    c.setFont("DejaVu", 10)
    c.drawString(margin, y, f"Sub Total: ₱ {float(transaction['subTotal']):.2f}")
    y -= line_height
    if transaction['deliveryFee']:
        c.drawString(margin, y, f"Delivery Fee: ₱ {float(transaction['deliveryFee']):.2f}")
        y -= line_height
    if transaction['discount']:
        c.drawString(margin, y, f"Discount: ₱ {float(transaction['discount']):.2f}")
        y -= line_height
    c.drawString(margin, y, f"TOTAL: ₱ {float(transaction['totalAmount']):.2f}")
    y -= line_height
    c.drawString(margin, y, f"Cash: ₱ {float(transaction['amountReceived']):.2f}")
    y -= line_height
    c.drawString(margin, y, f"Change: ₱ {float(float(transaction['amountReceived']) - float(transaction['totalAmount'])):.2f}")
    y -= line_height * 2

    c.line(margin, y, right_margin, y)
    y -= 10

    c.setFont("DejaVu", 8)
    c.drawString(margin, y, "This is an Order Slip. Ask for an Official Receipt at the Receipt Counter.")
    
    c.showPage()
    c.save()

    buffer.seek(0)
    
    return buffer
