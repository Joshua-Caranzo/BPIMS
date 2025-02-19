from models import BranchItem, StockInput
from utils import create_response
from tortoise import Tortoise
from decimal import Decimal

""" GET METHODS """
async def get_products(categoryId, branchId, page=1, search=""):
    pageSize = 30
    offset = (page - 1) * pageSize

    sqlQuery = """
        SELECT 
            i.id, 
            i.name, 
            i.categoryId, 
            i.price, 
            i.cost, 
            i.isManaged, 
            i.imagePath, 
            bi.quantity,
            i.sellByUnit
        FROM items i
        LEFT JOIN branchitem bi ON i.id = bi.itemId
        WHERE bi.branchId = %s
    """

    params = [branchId]

    if categoryId != 0 and categoryId != -1:
        sqlQuery += " AND i.categoryId = %s"
        params.append(categoryId)

    if search:
        sqlQuery += " AND i.name LIKE %s"
        params.append(f'%{search}%')

    sqlQuery += " ORDER BY i.name"
    sqlQuery += " LIMIT %s OFFSET %s"
    params.extend([pageSize, offset])

    connection = Tortoise.get_connection('default')
    result = await connection.execute_query(sqlQuery, tuple(params))

    countQuery = """
        SELECT COUNT(*) 
        FROM items i
        LEFT JOIN branchitem bi ON i.id = bi.itemId
        WHERE bi.branchId = %s
    """
    totalCountResult = await connection.execute_query(countQuery, (branchId,))
    totalCount = totalCountResult[1][0]['COUNT(*)']

    items = result[1]

    itemList = [
        {
            "id": item['id'],
            "name": item['name'],
            "categoryId": item['categoryId'],
            "price": item['price'],
            "cost": item['cost'],
            "isManaged": item['isManaged'],
            "imagePath": item['imagePath'],
            "quantity": item['quantity'],
            "sellbyUnit": bool(item['sellByUnit'])
        }
        for item in items
    ]

    return create_response(True, 'Items Successfully Retrieved', itemList, None, totalCount), 200

async def getBranchStocks(categoryId, branchId, page=1, search=""):
    pageSize = 30
    offset = (page - 1) * pageSize

    sqlQuery = """
        SELECT bi.id, i.name, bi.quantity, i.unitOfMeasure, i.criticalValue, i.sellByUnit FROM items i 
        INNER JOIN branchitem bi ON bi.itemId = i.id
        WHERE bi.branchId = %s
    """
    params = [branchId]

    if int(categoryId) == 1:
        sqlQuery += " AND bi.quantity < i.criticalValue"

    if search:
        sqlQuery += " AND i.name LIKE %s"
        params.append(f'%{search}%')

    sqlQuery += " ORDER BY i.name"
    sqlQuery += " LIMIT %s OFFSET %s"
    params.extend([pageSize, offset])

    connection = Tortoise.get_connection('default')
    result = await connection.execute_query(sqlQuery, tuple(params))

    countQuery = """
        SELECT COUNT(*) 
        FROM items i
        LEFT JOIN branchitem bi ON i.id = bi.itemId
        WHERE bi.branchId = %s
    """
    totalCountResult = await connection.execute_query(countQuery, (branchId,))
    totalCount = totalCountResult[1][0]['COUNT(*)']

    items = result[1]

    itemList = [
        {
            "id": item['id'],
            "name": item['name'],
            "quantity": item['quantity'],
            "unitOfMeasure": item['unitOfMeasure'],
            "criticalValue": item['criticalValue'],
            "sellByUnit": bool(item['sellByUnit'])
        }
        for item in items
    ]

    return create_response(True, 'Items Successfully Retrieved', itemList, None, totalCount), 200

async def getStockHistory(itemId):
    sqlQuery = """
        SELECT * from Stockinputs WHERE branchItemId = %s
    """
    params = [itemId]

    sqlQuery += " ORDER BY deliveryDate"

    connection = Tortoise.get_connection('default')
    result = await connection.execute_query(sqlQuery, tuple(params))

    countQuery = """
        SELECT COUNT(*) from Stockinputs WHERE branchItemId = %s
    """
    totalCountResult = await connection.execute_query(countQuery, (itemId,))
    totalCount = totalCountResult[1][0]['COUNT(*)']

    items = result[1]

    itemList = [
        {
            "id": item['id'],
            "qty": item['qty'],
            "moq": item['moq'],
            "deliveryDate": item['deliveryDate'],
            "deliveredBy": item['deliveredBy'],
            "expectedTotalQty": item['expectedQty'],
            "actualTotalQty": item['actualQty'],
            "branchItemId": item['branchItemId']
        }
        for item in items
    ]

    return create_response(True, 'Items Successfully Retrieved', itemList, None, totalCount), 200

async def getProductsHQ(categoryId, page=1, search=""):
    pageSize = 30
    offset = (page - 1) * pageSize

    sqlQuery = """
        SELECT 
            i.id, 
            i.name, 
            i.categoryId, 
            i.price, 
            i.cost, 
            i.isManaged, 
            i.imagePath, 
            i.sellByUnit
        FROM items i
    """

    params = []

    if categoryId != 0 and categoryId != -1:
        sqlQuery += " AND i.categoryId = %s"
        params.append(categoryId)

    if search:
        sqlQuery += " AND i.name LIKE %s"
        params.append(f'%{search}%')

    sqlQuery += " ORDER BY i.name"
    sqlQuery += " LIMIT %s OFFSET %s"
    params.extend([pageSize, offset])

    connection = Tortoise.get_connection('default')
    result = await connection.execute_query(sqlQuery, tuple(params))

    countQuery = """
        SELECT COUNT(*) 
        FROM items i
    """
    totalCountResult = await connection.execute_query(countQuery)
    totalCount = totalCountResult[1][0]['COUNT(*)']

    items = result[1]

    itemList = [
        {
            "id": item['id'],
            "name": item['name'],
            "categoryId": item['categoryId'],
            "price": item['price'],
            "cost": item['cost'],
            "isManaged": item['isManaged'],
            "imagePath": item['imagePath'],
            "sellbyUnit": bool(item['sellByUnit'])
        }
        for item in items
    ]

    return create_response(True, 'Items Successfully Retrieved', itemList, None, totalCount), 200

async def createStockInput(stockInput):
    branchItem = await BranchItem.get_or_none(id=stockInput['branchItemId'])

    if not branchItem:
        return create_response(False, 'Item not found', None, None), 200

    await StockInput.create(
        qty=stockInput['qty'],
        moq=stockInput['moq'],
        deliveryDate=stockInput['deliveryDate'],
        deliveredBy=stockInput['deliveredBy'],
        expectedQty=stockInput['expectedTotalQty'],
        actualQty=stockInput['actualTotalQty'],
        branchItemId=branchItem.id
    )
    branchItem.quantity += Decimal(str(stockInput['qty']))

    await branchItem.save()

    return create_response(True, "Success", None, None), 200

