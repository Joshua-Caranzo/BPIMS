from utils import create_response
from tortoise import Tortoise

async def getWHStocks(categoryId, branchId, page=1, search=""):
    pageSize = 30
    offset = (page - 1) * pageSize

    sqlQuery = """
       SELECT wh.id, i.name, wh.quantity, i.unitOfMeasure, i.criticalValue, i.sellByUnit, i.moq, i.imagePath
       FROM items i
        INNER JOIN warehouseItems wh ON wh.itemId = i.id
        WHERE i.isManaged = 1
    """
    params = [branchId]

    if int(categoryId) == 1:
        sqlQuery += " AND wh.quantity < i.criticalValue"

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
        INNER JOIN warehouseItems wh ON wh.itemId = i.id
        WHERE i.isManaged = 1
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
            "sellByUnit": bool(item['sellByUnit']),
            "moq": item['moq'],
            "imagePath": item['imagePath']
        }
        for item in items
    ]

    return create_response(True, 'Items Successfully Retrieved', itemList, None, totalCount), 200