use super::schema;
use std::borrow::Cow;

use shopify_function::prelude::*;
use shopify_function::Result;

#[shopify_function]
fn cart_transform_run(
    input: schema::cart_transform_run::Input,
) -> Result<schema::CartTransformRunResult> {
    let presentment_currency_rate = input.presentment_currency_rate().0;
    let cart_operations =
        get_expand_cart_operations(input.cart(), presentment_currency_rate);

    Ok(schema::CartTransformRunResult {
        operations: cart_operations,
    })
}

fn get_expand_cart_operations(
    cart: &schema::cart_transform_run::input::Cart,
    presentment_currency_rate: f64,
) -> Vec<schema::Operation> {
    let mut result: Vec<schema::Operation> = Vec::new();

    for line in cart.lines().iter() {
        let variant = match &line.merchandise() {
            schema::cart_transform_run::input::cart::lines::Merchandise::ProductVariant(variant) => {
                Some(variant)
            }
            _ => None,
        };
        if variant.is_none() {
            continue;
        }

        if let Some(merchandise) = &variant {
            let component_references = get_component_references(merchandise);

            if component_references.is_empty() {
                continue;
            }

            let component_prices = get_component_prices(merchandise);
            if component_prices.len() != component_references.len() {
                log!(
                    "Skipping bundle expand: component_prices count ({}) must match component_reference count ({})",
                    component_prices.len(),
                    component_references.len()
                );
                continue;
            }

            let mut expand_relationships: Vec<schema::ExpandedItem> = Vec::new();

            for (index, reference) in component_references.iter().enumerate() {
                let expand_relationship = schema::ExpandedItem {
                    merchandise_id: reference.clone(),
                    quantity: 1,
                    price: Some(build_component_price(
                        &component_prices[index],
                        presentment_currency_rate,
                    )),
                    attributes: None,
                };

                expand_relationships.push(expand_relationship);
            }

            let expand_operation = schema::LineExpandOperation {
                cart_line_id: line.id().clone(),
                expanded_cart_items: expand_relationships,
                price: None,
                image: None,
                title: None,
            };

            result.push(schema::Operation::LineExpand(expand_operation));
        }
    }

    result
}

fn build_component_price(
    price: &str,
    presentment_currency_rate: f64,
) -> schema::ExpandedItemPriceAdjustment {
    let base_price = price.parse::<f64>().unwrap_or(0.0);

    schema::ExpandedItemPriceAdjustment {
        adjustment: schema::ExpandedItemPriceAdjustmentValue::FixedPricePerUnit(
            schema::ExpandedItemFixedPricePerUnitAdjustment {
                amount: Decimal(base_price * presentment_currency_rate),
            },
        ),
    }
}

pub type ComponentReferences = Vec<schema::Id>;
pub type ComponentPrices = Vec<String>;

fn get_component_references(
    variant: &schema::cart_transform_run::input::cart::lines::merchandise::ProductVariant,
) -> Cow<[schema::Id]> {
    if let Some(component_reference_metafield) = &variant.component_reference() {
        return component_reference_metafield.json_value().into();
    }

    Vec::new().into()
}

fn get_component_prices(
    variant: &schema::cart_transform_run::input::cart::lines::merchandise::ProductVariant,
) -> Cow<[String]> {
    if let Some(component_prices_metafield) = &variant.component_prices() {
        return component_prices_metafield.json_value().into();
    }

    Vec::new().into()
}
