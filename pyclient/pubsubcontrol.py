#ref: https://github.com/googleapis/python-pubsub/blob/master/samples/snippets/subscriber.py
import argparse

def list_subscriptions_in_topic(project_id, topic_id):
    """Lists all subscriptions for a given topic."""
    # [START pubsub_list_topic_subscriptions]
    from google.cloud import pubsub_v1

    # TODO(developer)
    # project_id = "your-project-id"
    # topic_id = "your-topic-id"

    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    response = publisher.list_topic_subscriptions(request={"topic": topic_path})
    for subscription in response:
        print(subscription)
    # [END pubsub_list_topic_subscriptions]


def list_subscriptions_in_project(project_id):
    """Lists all subscriptions in the current project."""
    # [START pubsub_list_subscriptions]
    from google.cloud import pubsub_v1

    # TODO(developer)
    # project_id = "your-project-id"

    subscriber = pubsub_v1.SubscriberClient()
    project_path = f"projects/{project_id}"

    # Wrap the subscriber in a 'with' block to automatically call close() to
    # close the underlying gRPC channel when done.
    with subscriber:
        for subscription in subscriber.list_subscriptions(
            request={"project": project_path}
        ):
            print(subscription.name)
    # [END pubsub_list_subscriptions]


def create_subscription(project_id, topic_id, subscription_id):
    """Create a new pull subscription on the given topic."""
    # [START pubsub_create_pull_subscription]
    from google.cloud import pubsub_v1

    # TODO(developer)
    # project_id = "your-project-id"
    # topic_id = "your-topic-id"
    # subscription_id = "your-subscription-id"

    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = publisher.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Wrap the subscriber in a 'with' block to automatically call close() to
    # close the underlying gRPC channel when done.
    with subscriber:
        subscription = subscriber.create_subscription(
            request={"name": subscription_path, "topic": topic_path}
        )

    print(f"Subscription created: {subscription}")
    # [END pubsub_create_pull_subscription]

def delete_subscription(project_id, subscription_id):
    """Deletes an existing Pub/Sub topic."""
    # [START pubsub_delete_subscription]
    from google.cloud import pubsub_v1

    # TODO(developer)
    # project_id = "your-project-id"
    # subscription_id = "your-subscription-id"

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Wrap the subscriber in a 'with' block to automatically call close() to
    # close the underlying gRPC channel when done.
    with subscriber:
        subscriber.delete_subscription(request={"subscription": subscription_path})

    print(f"Subscription deleted: {subscription_path}.")
    # [END pubsub_delete_subscription]

#usage: python3 sub.py cmpelkk cmpe181dev1-subscription
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--project_id", type=str, default='cmpelkk', help="Google Cloud project ID")
    parser.add_argument("--subscription_name", type=str, default='cmpe181dev1-subscription', help="Pub/Sub subscription name")
    parser.add_argument("--topic_name", type=str, default='cmpeiotdevice1', help="topic name")

    # parser.add_argument("--listsubscriptioninproject", action='store_true')
    # parser.add_argument("--listsubscriptiontopic", action='store_true')
    # parser.add_argument("--createsubscription", action='store_true')
    # parser.add_argument("--deletesubscription", action='store_true')

    args = parser.parse_args()

    #create_subscription(args.project_id, args.topic_name, args.subscription_name)

    #if args.listsubscriptioninproject:
    #list_subscriptions_in_project(args.project_id)
    
    # if args.listsubscriptiontopic:
    list_subscriptions_in_topic(args.project_id, args.topic_name)

