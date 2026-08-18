use shopify_function::prelude::*;
use std::process;

pub mod cart_transform_run;

#[typegen("schema.graphql")]
pub mod schema {
    #[query("src/cart_transform_run.graphql", custom_scalar_overrides = {
        "Input.cart.lines.merchandise.component_reference.jsonValue" => super::cart_transform_run::ComponentReferences,
        "Input.cart.lines.merchandise.component_prices.jsonValue" => super::cart_transform_run::ComponentPrices,
    })]
    pub mod cart_transform_run {}
}

fn main() {
    log!("Please invoke a named export.");
    process::abort();
}
