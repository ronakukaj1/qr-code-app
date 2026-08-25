use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

#[derive(Deserialize)]
#[shopify_function(rename_all = "camelCase")]
pub struct DiscountConfiguration {
    cart_line_percentage: f64,
    order_percentage: f64,
    collection_ids: Vec<String>,
}

#[shopify_function]
fn cart_lines_discounts_generate_run(
    input: schema::cart_lines_discounts_generate_run::Input,
) -> Result<schema::CartLinesDiscountsGenerateRunResult> {
    let config = match input.discount().metafield() {
        Some(metafield) => metafield.json_value(),
        None => return Err("No metafield provided".into()),
    };

    let has_order_discount_class = input
        .discount()
        .discount_classes()
        .contains(&schema::DiscountClass::Order);
    let has_product_discount_class = input
        .discount()
        .discount_classes()
        .contains(&schema::DiscountClass::Product);

    if !has_order_discount_class && !has_product_discount_class {
        return Ok(schema::CartLinesDiscountsGenerateRunResult { operations: vec![] });
    }

    let mut operations = vec![];

    if has_product_discount_class && config.cart_line_percentage > 0.0 {
        let mut cart_line_targets = vec![];
        for line in input.cart().lines() {
            if let schema::cart_lines_discounts_generate_run::input::cart::lines::Merchandise::ProductVariant(
                variant,
            ) = line.merchandise()
            {
                if *variant.product().in_any_collection() || config.collection_ids.is_empty() {
                    cart_line_targets.push(schema::ProductDiscountCandidateTarget::CartLine(
                        schema::CartLineTarget {
                            id: line.id().clone(),
                            quantity: None,
                        },
                    ));
                }
            }
        }

        if !cart_line_targets.is_empty() {
            operations.push(schema::CartOperation::ProductDiscountsAdd(
                schema::ProductDiscountsAddOperation {
                    selection_strategy: schema::ProductDiscountSelectionStrategy::First,
                    candidates: vec![schema::ProductDiscountCandidate {
                        targets: cart_line_targets,
                        message: Some(format!("{}% OFF PRODUCT", config.cart_line_percentage)),
                        value: schema::ProductDiscountCandidateValue::Percentage(
                            schema::Percentage {
                                value: Decimal(config.cart_line_percentage),
                            },
                        ),
                        associated_discount_code: None,
                        prerequisites: None,
                    }],
                },
            ));
        }
    }

    if has_order_discount_class && config.order_percentage > 0.0 {
        operations.push(schema::CartOperation::OrderDiscountsAdd(
            schema::OrderDiscountsAddOperation {
                selection_strategy: schema::OrderDiscountSelectionStrategy::First,
                candidates: vec![schema::OrderDiscountCandidate {
                    targets: vec![schema::OrderDiscountCandidateTarget::OrderSubtotal(
                        schema::OrderSubtotalTarget {
                            excluded_cart_line_ids: vec![],
                        },
                    )],
                    message: Some(format!("{}% OFF ORDER", config.order_percentage)),
                    value: schema::OrderDiscountCandidateValue::Percentage(schema::Percentage {
                        value: Decimal(config.order_percentage),
                    }),
                    conditions: None,
                    associated_discount_code: None,
                }],
            },
        ));
    }

    Ok(schema::CartLinesDiscountsGenerateRunResult { operations })
}
