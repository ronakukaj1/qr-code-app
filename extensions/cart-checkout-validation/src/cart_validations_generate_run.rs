use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

#[shopify_function]
fn cart_validations_generate_run(
    input: schema::cart_validations_generate_run::Input,
) -> Result<schema::CartValidationsGenerateRunResult> {
    let mut operations = Vec::new();
    let mut errors = Vec::new();
    let error = schema::ValidationError {
        message:
            "There's an order maximum of $1,000 for customers without established order history"
                .to_owned(),
        target: "cart".to_owned(),
    };

    let order_subtotal: f64 = input.cart().cost().subtotal_amount().amount().as_f64();

    if order_subtotal > 5000.0 {
        if let Some(buyer_identity) = input.cart().buyer_identity() {
            if let Some(customer) = buyer_identity.customer() {
                if *customer.number_of_orders() < 5 {
                    errors.push(error);
                }
            } else {
                errors.push(error);
            }
        } else {
            errors.push(error);
        }
    }

    let operation = schema::ValidationAddOperation { errors };
    operations.push(schema::Operation::ValidationAdd(operation));

    Ok(schema::CartValidationsGenerateRunResult { operations })
}
