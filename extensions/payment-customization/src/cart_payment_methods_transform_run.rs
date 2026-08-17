use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

#[shopify_function]
fn cart_payment_methods_transform_run(input: schema::cart_payment_methods_transform_run::Input) -> Result<schema::CartPaymentMethodsTransformRunResult> {
    let no_changes = schema::CartPaymentMethodsTransformRunResult { operations: vec![] };

    // Get the cart total from the function input, and return early if it's below 100
    let cart_total: f64 = input.cart().cost().total_amount().amount().as_f64();
    if cart_total < 100.0 {
        log!("Cart total is not high enough, no need to hide the payment method.");
        return Ok(no_changes);
    }

    // Find the payment method to hide, and create a hide output operation from it
    let operations = input
        .payment_methods()
        .iter()
        .find(|&method| method.name() == "Cash on Delivery")
        .map(|method| {
            vec![schema::Operation::PaymentMethodHide(schema::PaymentMethodHideOperation {
                payment_method_id: method.id().to_string(),
                placements: None,
            })]
        })
        .unwrap_or_default();

    Ok(schema::CartPaymentMethodsTransformRunResult { operations })
}